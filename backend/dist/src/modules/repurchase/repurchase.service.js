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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RepurchaseService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const repurchase_commission_service_1 = require("../repurchase-commission/repurchase-commission.service");
const dashboard_cache_service_1 = require("../dashboard/dashboard-cache.service");
const client_1 = require("@prisma/client");
let RepurchaseService = class RepurchaseService {
    prisma;
    auditService;
    repurchaseCommissionService;
    dashboardCacheService;
    constructor(prisma, auditService, repurchaseCommissionService, dashboardCacheService) {
        this.prisma = prisma;
        this.auditService = auditService;
        this.repurchaseCommissionService = repurchaseCommissionService;
        this.dashboardCacheService = dashboardCacheService;
    }
    async hasCommissionsGenerated(repurchaseEntryId) {
        const count = await this.prisma.repurchaseCommissionLedger.count({
            where: { repurchaseEntryId },
        });
        return count > 0;
    }
    async create(dto, actorId, actorRole) {
        const { transactionRef, memberId, amount, transactionDate, remarks, createdBy, } = dto;
        return this.prisma.$transaction(async (tx) => {
            const existingRef = await tx.repurchaseEntry.findFirst({
                where: { transactionRef, deletedAt: null },
            });
            if (existingRef) {
                throw new common_1.ConflictException(`Transaction reference '${transactionRef}' already exists`);
            }
            const member = await tx.member.findFirst({
                where: {
                    OR: [{ id: memberId }, { memberCode: memberId }],
                },
            });
            if (!member) {
                throw new common_1.NotFoundException(`Member '${memberId}' does not exist`);
            }
            if (member.status !== client_1.MemberStatus.ACTIVE) {
                throw new common_1.BadRequestException(`Member '${member.name}' (${member.memberCode}) is not active (current status: ${member.status})`);
            }
            const creatorId = actorId || createdBy || null;
            let entry;
            try {
                entry = await tx.repurchaseEntry.create({
                    data: {
                        transactionRef,
                        memberId: member.id,
                        amount: new client_1.Prisma.Decimal(amount),
                        transactionDate: transactionDate
                            ? new Date(transactionDate)
                            : new Date(),
                        remarks: remarks || null,
                        createdBy: creatorId,
                    },
                    include: {
                        member: {
                            select: {
                                id: true,
                                memberCode: true,
                                name: true,
                                mobile: true,
                                status: true,
                            },
                        },
                    },
                });
            }
            catch (error) {
                if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                    error.code === 'P2002') {
                    throw new common_1.ConflictException(`Transaction reference '${transactionRef}' already exists`);
                }
                throw error;
            }
            await this.repurchaseCommissionService.calculateForEntry(entry.id, tx);
            await this.auditService.logAction({
                actorId: creatorId,
                actorRole: actorRole || client_1.MemberRole.ADMIN,
                actionType: 'CREATE_REPURCHASE_ENTRY',
                entityType: 'RepurchaseEntry',
                entityId: entry.id,
                metadata: {
                    transactionRef: entry.transactionRef,
                    memberId: entry.memberId,
                    amount: Number(entry.amount),
                },
            });
            await this.dashboardCacheService?.invalidateRepurchaseCache();
            return this.mapToResponseDto(entry);
        });
    }
    async findAll(query) {
        const { page = 1, limit = 10, memberId, search, startDate, endDate, sortBy = 'transactionDate', sortOrder = 'desc', } = query;
        const skip = (page - 1) * limit;
        const where = {
            deletedAt: null,
        };
        if (memberId) {
            where.OR = [{ memberId }, { member: { memberCode: memberId } }];
        }
        if (startDate || endDate) {
            where.transactionDate = {};
            if (startDate)
                where.transactionDate.gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                where.transactionDate.lte = end;
            }
        }
        if (search && search.trim() !== '') {
            const term = search.trim();
            const searchWhere = {
                OR: [
                    { transactionRef: { contains: term, mode: 'insensitive' } },
                    { member: { name: { contains: term, mode: 'insensitive' } } },
                    { member: { memberCode: { contains: term, mode: 'insensitive' } } },
                    { member: { mobile: { contains: term } } },
                ],
            };
            if (where.OR) {
                where.AND = [{ OR: where.OR }, searchWhere];
                delete where.OR;
            }
            else {
                where.OR = searchWhere.OR;
            }
        }
        const validSortFields = [
            'transactionDate',
            'createdAt',
            'amount',
            'transactionRef',
        ];
        const orderByField = validSortFields.includes(sortBy)
            ? sortBy
            : 'transactionDate';
        const [total, entries] = await Promise.all([
            this.prisma.repurchaseEntry.count({ where }),
            this.prisma.repurchaseEntry.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [orderByField]: sortOrder },
                include: {
                    member: {
                        select: {
                            id: true,
                            memberCode: true,
                            name: true,
                            mobile: true,
                            status: true,
                        },
                    },
                },
            }),
        ]);
        const data = entries.map((e) => this.mapToResponseDto(e));
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
        const entry = await this.prisma.repurchaseEntry.findFirst({
            where: { id, deletedAt: null },
            include: {
                member: {
                    select: {
                        id: true,
                        memberCode: true,
                        name: true,
                        mobile: true,
                        status: true,
                    },
                },
            },
        });
        if (!entry) {
            throw new common_1.NotFoundException(`Repurchase entry with ID '${id}' not found`);
        }
        return this.mapToResponseDto(entry);
    }
    async update(id, dto, actorId, actorRole) {
        const existing = await this.prisma.repurchaseEntry.findFirst({
            where: { id, deletedAt: null },
        });
        if (!existing) {
            throw new common_1.NotFoundException(`Repurchase entry with ID '${id}' not found`);
        }
        const hasCommissions = await this.hasCommissionsGenerated(id);
        if (hasCommissions) {
            throw new common_1.BadRequestException(`Repurchase entry '${existing.transactionRef}' is locked because commissions have already been calculated. Please issue a separate correction or reversal entry.`);
        }
        const { transactionRef, memberId, amount, transactionDate, remarks } = dto;
        if (transactionRef && transactionRef !== existing.transactionRef) {
            const collision = await this.prisma.repurchaseEntry.findFirst({
                where: { transactionRef, deletedAt: null },
            });
            if (collision) {
                throw new common_1.ConflictException(`Transaction reference '${transactionRef}' is already taken`);
            }
        }
        let updatedMemberId = existing.memberId;
        if (memberId && memberId !== existing.memberId) {
            const member = await this.prisma.member.findFirst({
                where: { OR: [{ id: memberId }, { memberCode: memberId }] },
            });
            if (!member) {
                throw new common_1.NotFoundException(`Member '${memberId}' does not exist`);
            }
            if (member.status !== client_1.MemberStatus.ACTIVE) {
                throw new common_1.BadRequestException(`Member '${member.name}' (${member.memberCode}) is not active (current status: ${member.status})`);
            }
            updatedMemberId = member.id;
        }
        let updated;
        try {
            updated = await this.prisma.repurchaseEntry.update({
                where: { id },
                data: {
                    ...(transactionRef ? { transactionRef } : {}),
                    memberId: updatedMemberId,
                    ...(amount ? { amount: new client_1.Prisma.Decimal(amount) } : {}),
                    ...(transactionDate
                        ? { transactionDate: new Date(transactionDate) }
                        : {}),
                    ...(remarks !== undefined ? { remarks } : {}),
                },
                include: {
                    member: {
                        select: {
                            id: true,
                            memberCode: true,
                            name: true,
                            mobile: true,
                            status: true,
                        },
                    },
                },
            });
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002') {
                throw new common_1.ConflictException(`Transaction reference '${transactionRef}' is already taken`);
            }
            throw error;
        }
        await this.auditService.logAction({
            actorId: actorId || null,
            actorRole: actorRole || client_1.MemberRole.ADMIN,
            actionType: 'UPDATE_REPURCHASE_ENTRY',
            entityType: 'RepurchaseEntry',
            entityId: id,
            metadata: {
                updatedFields: Object.keys(dto),
            },
        });
        return this.mapToResponseDto(updated);
    }
    async remove(id, actorId, actorRole) {
        const existing = await this.prisma.repurchaseEntry.findFirst({
            where: { id, deletedAt: null },
        });
        if (!existing) {
            throw new common_1.NotFoundException(`Repurchase entry with ID '${id}' not found`);
        }
        const hasCommissions = await this.hasCommissionsGenerated(id);
        if (hasCommissions) {
            throw new common_1.BadRequestException(`Cannot delete repurchase entry '${existing.transactionRef}' because commissions have already been generated for this transaction.`);
        }
        const softDeleted = await this.prisma.repurchaseEntry.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                transactionRef: `${existing.transactionRef}_deleted_${Date.now()}`,
            },
        });
        await this.auditService.logAction({
            actorId: actorId || null,
            actorRole: actorRole || client_1.MemberRole.ADMIN,
            actionType: 'DELETE_REPURCHASE_ENTRY',
            entityType: 'RepurchaseEntry',
            entityId: id,
            metadata: {
                transactionRef: existing.transactionRef,
                softDeleted: true,
            },
        });
        return {
            message: `Repurchase entry '${existing.transactionRef}' soft-deleted successfully`,
        };
    }
    mapToResponseDto(entry) {
        return {
            id: entry.id,
            transactionRef: entry.transactionRef,
            memberId: entry.memberId,
            member: entry.member,
            amount: Number(entry.amount),
            transactionDate: entry.transactionDate,
            remarks: entry.remarks,
            createdBy: entry.createdBy,
            createdAt: entry.createdAt,
            updatedAt: entry.updatedAt,
            deletedAt: entry.deletedAt || undefined,
        };
    }
};
exports.RepurchaseService = RepurchaseService;
exports.RepurchaseService = RepurchaseService = __decorate([
    (0, common_1.Injectable)(),
    __param(3, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        repurchase_commission_service_1.RepurchaseCommissionService,
        dashboard_cache_service_1.DashboardCacheService])
], RepurchaseService);
//# sourceMappingURL=repurchase.service.js.map