"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MembershipCommissionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MembershipCommissionService = exports.DEFAULT_20_LEVEL_RATES = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const client_1 = require("@prisma/client");
exports.DEFAULT_20_LEVEL_RATES = [
    { level: 1, percentage: 10.0, description: 'Level 1 Sponsor Commission' },
    {
        level: 2,
        percentage: 5.0,
        description: 'Level 2 Direct Upline Commission',
    },
    { level: 3, percentage: 2.5, description: 'Level 3 Upline Commission' },
    { level: 4, percentage: 1.5, description: 'Level 4 Upline Commission' },
    { level: 5, percentage: 1.0, description: 'Level 5 Upline Commission' },
    { level: 6, percentage: 0.75, description: 'Level 6 Upline Commission' },
    ...Array.from({ length: 14 }, (_, i) => ({
        level: i + 7,
        percentage: 0.5,
        description: `Level ${i + 7} Upline Commission`,
    })),
];
let MembershipCommissionService = MembershipCommissionService_1 = class MembershipCommissionService {
    prisma;
    auditService;
    logger = new common_1.Logger(MembershipCommissionService_1.name);
    constructor(prisma, auditService) {
        this.prisma = prisma;
        this.auditService = auditService;
    }
    async getActiveConfig(version, txClient) {
        const db = txClient || this.prisma;
        let targetVersion = version;
        if (!targetVersion) {
            const latestActive = await db.membershipCommissionConfig.findFirst({
                where: { isActive: true },
                orderBy: { version: 'desc' },
                select: { version: true },
            });
            if (latestActive) {
                targetVersion = latestActive.version;
            }
        }
        if (targetVersion) {
            const configs = await db.membershipCommissionConfig.findMany({
                where: { version: targetVersion },
                orderBy: { level: 'asc' },
            });
            if (configs.length > 0) {
                return configs.map((c) => ({
                    ...c,
                    percentage: Number(c.percentage),
                }));
            }
        }
        return exports.DEFAULT_20_LEVEL_RATES.map((r) => ({
            id: `default-v1-lvl-${r.level}`,
            version: 1,
            level: r.level,
            percentage: r.percentage,
            isActive: true,
            description: r.description,
            createdAt: new Date(),
            updatedAt: new Date(),
        }));
    }
    async publishConfigVersion(dto, actorId) {
        const { version, rates, isActive = true } = dto;
        if (!rates || rates.length === 0) {
            throw new common_1.BadRequestException('Commission rate schedule must contain at least one level');
        }
        const levelSet = new Set();
        for (const r of rates) {
            if (r.level < 1 || r.level > 20) {
                throw new common_1.BadRequestException(`Invalid level ${r.level}. Levels must be between 1 and 20.`);
            }
            if (levelSet.has(r.level)) {
                throw new common_1.BadRequestException(`Duplicate level entry found for level ${r.level}`);
            }
            levelSet.add(r.level);
        }
        return this.prisma.$transaction(async (tx) => {
            if (isActive) {
                await tx.membershipCommissionConfig.updateMany({
                    where: { isActive: true },
                    data: { isActive: false },
                });
            }
            const createdConfigs = [];
            for (const r of rates) {
                const config = await tx.membershipCommissionConfig.upsert({
                    where: {
                        version_level: {
                            version,
                            level: r.level,
                        },
                    },
                    update: {
                        percentage: new client_1.Prisma.Decimal(r.percentage),
                        isActive,
                        description: r.description,
                    },
                    create: {
                        version,
                        level: r.level,
                        percentage: new client_1.Prisma.Decimal(r.percentage),
                        isActive,
                        description: r.description,
                    },
                });
                createdConfigs.push(config);
            }
            await this.auditService.logAction({
                actorId: actorId || null,
                actionType: 'PUBLISH_COMMISSION_CONFIG',
                entityType: 'MembershipCommissionConfig',
                entityId: `version-${version}`,
                metadata: {
                    version,
                    isActive,
                    rateCount: rates.length,
                },
            });
            return createdConfigs.map((c) => ({
                ...c,
                percentage: Number(c.percentage),
            }));
        });
    }
    async calculateForNewMember(memberId, joiningFee = 10000, txClient) {
        const db = txClient || this.prisma;
        const existingCount = await db.membershipCommissionLedger.count({
            where: { sourceMemberId: memberId },
        });
        if (existingCount > 0) {
            this.logger.log(`Commissions already calculated for member '${memberId}'. Skipping duplicate engine execution.`);
            const existingLedgers = await db.membershipCommissionLedger.findMany({
                where: { sourceMemberId: memberId },
                orderBy: { level: 'asc' },
            });
            return existingLedgers.map((l) => this.mapLedgerToDto(l));
        }
        const sourceMember = await db.member.findUnique({
            where: { id: memberId },
            select: { id: true, referrerId: true, memberCode: true, status: true },
        });
        if (!sourceMember) {
            throw new common_1.NotFoundException(`Member with ID '${memberId}' not found`);
        }
        if (!sourceMember.referrerId) {
            this.logger.log(`Member '${sourceMember.memberCode}' (${memberId}) has no referrer (Root/Direct). No upline commissions generated.`);
            return [];
        }
        const activeConfigs = await this.getActiveConfig(undefined, txClient);
        const rateMap = new Map();
        activeConfigs.forEach((c) => {
            rateMap.set(c.level, Number(c.percentage));
        });
        let uplineNodes = [];
        try {
            if (typeof db.$queryRaw === 'function') {
                const rawNodes = await db.$queryRaw(client_1.Prisma.sql `
          WITH RECURSIVE upline AS (
            SELECT 
              m.id,
              m.member_code AS "memberCode",
              m.referrer_id AS "referrerId",
              m.status AS status,
              m.is_commission_frozen AS "isCommissionFrozen",
              1 AS level
            FROM members target_m
            INNER JOIN members m ON target_m.referrer_id = m.id
            WHERE target_m.id = ${memberId}

            UNION ALL

            SELECT 
              m.id,
              m.member_code AS "memberCode",
              m.referrer_id AS "referrerId",
              m.status AS status,
              m.is_commission_frozen AS "isCommissionFrozen",
              u.level + 1 AS level
            FROM members m
            INNER JOIN upline u ON m.id = u."referrerId"
            WHERE u.level < 20
          )
          SELECT id, "memberCode", "referrerId", status, "isCommissionFrozen", level FROM upline ORDER BY level ASC LIMIT 20;
        `);
                if (Array.isArray(rawNodes) && rawNodes.length > 0) {
                    uplineNodes = rawNodes.map((node) => ({
                        id: node.id,
                        memberCode: node.memberCode,
                        referrerId: node.referrerId,
                        status: node.status,
                        isCommissionFrozen: node.isCommissionFrozen,
                        level: Number(node.level),
                    }));
                }
            }
        }
        catch {
            uplineNodes = [];
        }
        if (uplineNodes.length === 0) {
            let currentRefId = sourceMember.referrerId;
            let lvl = 1;
            const visited = new Set([memberId]);
            while (currentRefId && lvl <= 20) {
                if (visited.has(currentRefId)) {
                    this.logger.warn(`Cycle detected in referral chain for member '${memberId}' at level ${lvl}. Aborting.`);
                    break;
                }
                visited.add(currentRefId);
                const parent = await db.member.findUnique({
                    where: { id: currentRefId },
                    select: {
                        id: true,
                        referrerId: true,
                        memberCode: true,
                        status: true,
                        isCommissionFrozen: true,
                    },
                });
                if (!parent)
                    break;
                uplineNodes.push({
                    id: parent.id,
                    memberCode: parent.memberCode,
                    referrerId: parent.referrerId,
                    status: parent.status,
                    isCommissionFrozen: parent.isCommissionFrozen,
                    level: lvl,
                });
                currentRefId = parent.referrerId;
                lvl++;
            }
        }
        const generatedLedgers = [];
        for (const node of uplineNodes) {
            if (node.level > 20)
                break;
            const ratePercentage = rateMap.get(node.level) ?? 0;
            if (ratePercentage > 0) {
                const commissionAmount = (joiningFee * ratePercentage) / 100;
                const ledgerStatus = !node.status || (node.status === client_1.MemberStatus.ACTIVE && !node.isCommissionFrozen)
                    ? client_1.CommissionStatus.PENDING
                    : client_1.CommissionStatus.HOLD;
                const ledger = await db.membershipCommissionLedger.create({
                    data: {
                        sourceMemberId: memberId,
                        beneficiaryMemberId: node.id,
                        level: node.level,
                        percentage: new client_1.Prisma.Decimal(ratePercentage),
                        amount: new client_1.Prisma.Decimal(commissionAmount),
                        status: ledgerStatus,
                    },
                });
                generatedLedgers.push(ledger);
            }
        }
        this.logger.log(`Successfully generated ${generatedLedgers.length} commission ledger entries for newly registered member '${sourceMember.memberCode}' (${memberId}).`);
        return generatedLedgers.map((l) => this.mapLedgerToDto(l));
    }
    async processRegistrationCommissions(sourceMemberId, packageAmount = 1000, txClient) {
        return this.calculateForNewMember(sourceMemberId, packageAmount, txClient);
    }
    async findAll(query) {
        const { page = 1, limit = 10, sourceMemberId, beneficiaryMemberId, level, status, sortBy = 'createdAt', sortOrder = 'desc', } = query;
        const skip = (page - 1) * limit;
        const where = {};
        if (sourceMemberId) {
            where.sourceMemberId = sourceMemberId;
        }
        if (beneficiaryMemberId) {
            where.beneficiaryMemberId = beneficiaryMemberId;
        }
        if (level) {
            where.level = level;
        }
        if (status) {
            where.status = status;
        }
        const validSortFields = ['createdAt', 'amount', 'level', 'status'];
        const orderByField = validSortFields.includes(sortBy)
            ? sortBy
            : 'createdAt';
        const [total, ledgers] = await Promise.all([
            this.prisma.membershipCommissionLedger.count({ where }),
            this.prisma.membershipCommissionLedger.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [orderByField]: sortOrder },
                include: {
                    sourceMember: {
                        select: { id: true, memberCode: true, name: true, mobile: true },
                    },
                    beneficiaryMember: {
                        select: { id: true, memberCode: true, name: true, mobile: true },
                    },
                },
            }),
        ]);
        const data = ledgers.map((l) => ({
            ...this.mapLedgerToDto(l),
            sourceMember: l.sourceMember,
            beneficiaryMember: l.beneficiaryMember,
        }));
        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async findById(id) {
        const ledger = await this.prisma.membershipCommissionLedger.findUnique({
            where: { id },
            include: {
                sourceMember: {
                    select: { id: true, memberCode: true, name: true },
                },
                beneficiaryMember: {
                    select: { id: true, memberCode: true, name: true },
                },
            },
        });
        if (!ledger) {
            throw new common_1.NotFoundException(`Membership commission ledger with ID '${id}' not found`);
        }
        return {
            ...this.mapLedgerToDto(ledger),
            sourceMember: ledger.sourceMember,
            beneficiaryMember: ledger.beneficiaryMember,
        };
    }
    mapLedgerToDto(ledger) {
        return {
            id: ledger.id,
            sourceMemberId: ledger.sourceMemberId,
            beneficiaryMemberId: ledger.beneficiaryMemberId,
            level: ledger.level,
            percentage: Number(ledger.percentage),
            amount: Number(ledger.amount),
            status: ledger.status,
            createdAt: ledger.createdAt,
            updatedAt: ledger.updatedAt,
        };
    }
};
exports.MembershipCommissionService = MembershipCommissionService;
exports.MembershipCommissionService = MembershipCommissionService = MembershipCommissionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], MembershipCommissionService);
//# sourceMappingURL=membership-commission.service.js.map