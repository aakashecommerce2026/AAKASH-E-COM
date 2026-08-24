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
var RepurchaseCommissionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RepurchaseCommissionService = exports.DEFAULT_REPURCHASE_COMMISSION_RATES = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const client_1 = require("@prisma/client");
exports.DEFAULT_REPURCHASE_COMMISSION_RATES = [
    { level: 1, percentage: 1.5, description: 'Level 1 Repurchase Commission' },
    { level: 2, percentage: 0.75, description: 'Level 2 Repurchase Commission' },
    { level: 3, percentage: 0.45, description: 'Level 3 Repurchase Commission' },
    { level: 4, percentage: 0.3, description: 'Level 4 Repurchase Commission' },
    { level: 5, percentage: 0.2, description: 'Level 5 Repurchase Commission' },
    { level: 6, percentage: 0.15, description: 'Level 6 Repurchase Commission' },
    { level: 7, percentage: 0.15, description: 'Level 7 Repurchase Commission' },
    { level: 8, percentage: 0.15, description: 'Level 8 Repurchase Commission' },
    { level: 9, percentage: 0.15, description: 'Level 9 Repurchase Commission' },
    {
        level: 10,
        percentage: 0.15,
        description: 'Level 10 Repurchase Commission',
    },
    {
        level: 11,
        percentage: 0.15,
        description: 'Level 11 Repurchase Commission',
    },
    {
        level: 12,
        percentage: 0.15,
        description: 'Level 12 Repurchase Commission',
    },
    {
        level: 13,
        percentage: 0.15,
        description: 'Level 13 Repurchase Commission',
    },
    {
        level: 14,
        percentage: 0.15,
        description: 'Level 14 Repurchase Commission',
    },
    {
        level: 15,
        percentage: 0.15,
        description: 'Level 15 Repurchase Commission',
    },
    {
        level: 16,
        percentage: 0.07,
        description: 'Level 16 Repurchase Commission',
    },
    {
        level: 17,
        percentage: 0.06,
        description: 'Level 17 Repurchase Commission',
    },
    {
        level: 18,
        percentage: 0.06,
        description: 'Level 18 Repurchase Commission',
    },
    {
        level: 19,
        percentage: 0.06,
        description: 'Level 19 Repurchase Commission',
    },
    {
        level: 20,
        percentage: 0.05,
        description: 'Level 20 Repurchase Commission',
    },
];
let RepurchaseCommissionService = RepurchaseCommissionService_1 = class RepurchaseCommissionService {
    prisma;
    auditService;
    logger = new common_1.Logger(RepurchaseCommissionService_1.name);
    constructor(prisma, auditService) {
        this.prisma = prisma;
        this.auditService = auditService;
    }
    async onModuleInit() {
        await this.validateStartupConfig();
    }
    async validateStartupConfig() {
        const config = await this.getActiveConfig();
        const totalSum = config.reduce((acc, c) => acc + Number(c.percentage), 0);
        const roundedSum = Math.round(totalSum * 10000) / 10000;
        if (config.length !== 20 || Math.abs(roundedSum - 5.0) > 0.0001) {
            const errorMsg = `CRITICAL CONFIGURATION ERROR: Active Repurchase Commission Config has ${config.length} configured levels summing to ${roundedSum}%, but must sum to EXACTLY 5.00% across 20 levels!`;
            this.logger.error(errorMsg);
            throw new Error(errorMsg);
        }
        this.logger.log(`✅ Repurchase Commission Startup Check Passed: 20 levels configured, total pool sum = ${roundedSum.toFixed(2)}%`);
    }
    async getActiveConfig(version, txClient) {
        const db = txClient || this.prisma;
        let targetVersion = version;
        if (!targetVersion) {
            const latestActive = await db.repurchaseCommissionConfig.findFirst({
                where: { isActive: true },
                orderBy: { version: 'desc' },
                select: { version: true },
            });
            if (latestActive) {
                targetVersion = latestActive.version;
            }
        }
        if (targetVersion) {
            const configs = await db.repurchaseCommissionConfig.findMany({
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
        return exports.DEFAULT_REPURCHASE_COMMISSION_RATES.map((r) => ({
            id: `default-v1-l${r.level}`,
            version: 1,
            level: r.level,
            percentage: r.percentage,
            isActive: true,
            description: r.description,
            createdAt: new Date(),
            updatedAt: new Date(),
        }));
    }
    async calculateForEntry(repurchaseEntryId, txClient) {
        const db = txClient || this.prisma;
        const repurchaseEntry = await db.repurchaseEntry.findFirst({
            where: { id: repurchaseEntryId, deletedAt: null },
        });
        if (!repurchaseEntry) {
            throw new common_1.NotFoundException(`Repurchase entry with ID '${repurchaseEntryId}' not found`);
        }
        const memberId = repurchaseEntry.memberId;
        const repurchaseAmount = Number(repurchaseEntry.amount);
        const sourceMember = await db.member.findUnique({
            where: { id: memberId },
            select: { id: true, memberCode: true, referrerId: true, status: true },
        });
        if (!sourceMember) {
            throw new common_1.NotFoundException(`Member with ID '${memberId}' not found`);
        }
        if (!sourceMember.referrerId) {
            this.logger.log(`Member '${sourceMember.memberCode}' (${memberId}) has no referrer (Root/Direct). No repurchase upline commissions generated.`);
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
              u.level + 1 AS level
            FROM members m
            INNER JOIN upline u ON m.id = u."referrerId"
            WHERE u.level < 20
          )
          SELECT id, "memberCode", "referrerId", status, level FROM upline ORDER BY level ASC LIMIT 20;
        `);
                if (Array.isArray(rawNodes) && rawNodes.length > 0) {
                    uplineNodes = rawNodes.map((node) => ({
                        id: node.id,
                        memberCode: node.memberCode,
                        referrerId: node.referrerId,
                        status: node.status,
                        level: Number(node.level),
                    }));
                }
            }
        }
        catch (error) {
            this.logger.warn(`CTE query unhandled or mock environment (${error.message}). Using iterative fallback.`);
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
                    },
                });
                if (!parent)
                    break;
                uplineNodes.push({
                    id: parent.id,
                    memberCode: parent.memberCode,
                    referrerId: parent.referrerId,
                    status: parent.status,
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
                const commissionAmount = Math.round(repurchaseAmount * (ratePercentage / 100) * 100) / 100;
                const ledgerStatus = !node.status || node.status === client_1.MemberStatus.ACTIVE
                    ? client_1.CommissionStatus.PENDING
                    : client_1.CommissionStatus.HOLD;
                const ledger = await db.repurchaseCommissionLedger.create({
                    data: {
                        repurchaseEntryId,
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
        this.logger.log(`Successfully generated ${generatedLedgers.length} repurchase commission ledger entries for repurchase transaction '${repurchaseEntry.transactionRef}' (Member ${sourceMember.memberCode}).`);
        return generatedLedgers.map((l) => this.mapLedgerToDto(l));
    }
    validateRatesSum(rates) {
        if (rates.length !== 20) {
            throw new common_1.BadRequestException(`Repurchase commission configuration must contain exactly 20 levels (provided ${rates.length})`);
        }
        const levels = new Set(rates.map((r) => r.level));
        for (let l = 1; l <= 20; l++) {
            if (!levels.has(l)) {
                throw new common_1.BadRequestException(`Missing configuration for level ${l}`);
            }
        }
        const total = rates.reduce((acc, r) => acc + Number(r.percentage), 0);
        const roundedTotal = Math.round(total * 10000) / 10000;
        if (Math.abs(roundedTotal - 5.0) > 0.0001) {
            throw new common_1.BadRequestException(`Configured repurchase commission percentages sum to ${roundedTotal}%, but must sum to EXACTLY 5.00%`);
        }
    }
    async updateConfig(dto, actorId) {
        this.validateRatesSum(dto.rates);
        return this.prisma.$transaction(async (tx) => {
            const latestActive = await tx.repurchaseCommissionConfig.findFirst({
                where: { isActive: true },
                orderBy: { version: 'desc' },
                select: { version: true },
            });
            const nextVersion = (latestActive?.version || 0) + 1;
            await tx.repurchaseCommissionConfig.updateMany({
                where: { isActive: true },
                data: { isActive: false },
            });
            await tx.repurchaseCommissionConfig.createMany({
                data: dto.rates.map((r) => ({
                    version: nextVersion,
                    level: r.level,
                    percentage: new client_1.Prisma.Decimal(r.percentage),
                    isActive: true,
                    description: r.description || `Level ${r.level} Repurchase Commission`,
                })),
            });
            const created = await tx.repurchaseCommissionConfig.findMany({
                where: { version: nextVersion },
                orderBy: { level: 'asc' },
            });
            await this.auditService.logAction({
                actorId: actorId || null,
                actionType: 'UPDATE_REPURCHASE_COMMISSION_CONFIG',
                entityType: 'RepurchaseCommissionConfig',
                entityId: `v${nextVersion}`,
                metadata: {
                    version: nextVersion,
                    ratesCount: dto.rates.length,
                    totalPoolPercentage: 5.0,
                },
            });
            return created.map((c) => ({
                ...c,
                percentage: Number(c.percentage),
            }));
        });
    }
    async findAll(query) {
        const { page = 1, limit = 10, repurchaseEntryId, sourceMemberId, beneficiaryMemberId, level, status, sortBy = 'createdAt', sortOrder = 'desc', } = query;
        const skip = (page - 1) * limit;
        const where = {};
        if (repurchaseEntryId)
            where.repurchaseEntryId = repurchaseEntryId;
        if (sourceMemberId)
            where.sourceMemberId = sourceMemberId;
        if (beneficiaryMemberId)
            where.beneficiaryMemberId = beneficiaryMemberId;
        if (level)
            where.level = Number(level);
        if (status)
            where.status = status;
        const validSortFields = ['createdAt', 'amount', 'level', 'status'];
        const orderByField = validSortFields.includes(sortBy)
            ? sortBy
            : 'createdAt';
        const [total, ledgers] = await Promise.all([
            this.prisma.repurchaseCommissionLedger.count({ where }),
            this.prisma.repurchaseCommissionLedger.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [orderByField]: sortOrder },
                include: {
                    repurchaseEntry: {
                        select: {
                            id: true,
                            transactionRef: true,
                            amount: true,
                            transactionDate: true,
                        },
                    },
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
            repurchaseEntry: l.repurchaseEntry,
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
        const ledger = await this.prisma.repurchaseCommissionLedger.findUnique({
            where: { id },
            include: {
                repurchaseEntry: {
                    select: {
                        id: true,
                        transactionRef: true,
                        amount: true,
                        transactionDate: true,
                    },
                },
                sourceMember: {
                    select: { id: true, memberCode: true, name: true, mobile: true },
                },
                beneficiaryMember: {
                    select: { id: true, memberCode: true, name: true, mobile: true },
                },
            },
        });
        if (!ledger) {
            throw new common_1.NotFoundException(`Repurchase commission ledger with ID '${id}' not found`);
        }
        return {
            ...this.mapLedgerToDto(ledger),
            repurchaseEntry: ledger.repurchaseEntry,
            sourceMember: ledger.sourceMember,
            beneficiaryMember: ledger.beneficiaryMember,
        };
    }
    mapLedgerToDto(ledger) {
        return {
            id: ledger.id,
            repurchaseEntryId: ledger.repurchaseEntryId,
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
exports.RepurchaseCommissionService = RepurchaseCommissionService;
exports.RepurchaseCommissionService = RepurchaseCommissionService = RepurchaseCommissionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], RepurchaseCommissionService);
//# sourceMappingURL=repurchase-commission.service.js.map