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
var DistributionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DistributionService = void 0;
const common_1 = require("@nestjs/common");
const bull_1 = require("@nestjs/bull");
const prisma_service_1 = require("../../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const notifications_service_1 = require("../notifications/notifications.service");
const client_1 = require("@prisma/client");
const system_settings_service_1 = require("../system-settings/system-settings.service");
let DistributionService = DistributionService_1 = class DistributionService {
    prisma;
    auditService;
    notificationsService;
    systemSettingsService;
    distributionQueue;
    logger = new common_1.Logger(DistributionService_1.name);
    constructor(prisma, auditService, notificationsService, systemSettingsService, distributionQueue) {
        this.prisma = prisma;
        this.auditService = auditService;
        this.notificationsService = notificationsService;
        this.systemSettingsService = systemSettingsService;
        this.distributionQueue = distributionQueue;
    }
    buildDateWhere(startDate, endDate) {
        if (!startDate && !endDate)
            return undefined;
        const dateFilter = {};
        if (startDate) {
            dateFilter.gte = new Date(startDate);
        }
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            dateFilter.lte = end;
        }
        return dateFilter;
    }
    async getPendingDistributionSummary() {
        const [pendingMembershipLedgers, pendingRepurchaseLedgers, membershipGrossSum, repurchaseGrossSum,] = await Promise.all([
            this.prisma.membershipCommissionLedger.count({
                where: { status: client_1.CommissionStatus.PENDING, distributionRecordId: null },
            }),
            this.prisma.repurchaseCommissionLedger.count({
                where: { status: client_1.CommissionStatus.PENDING, distributionRecordId: null },
            }),
            this.prisma.membershipCommissionLedger.aggregate({
                where: { status: client_1.CommissionStatus.PENDING, distributionRecordId: null },
                _sum: { amount: true },
            }),
            this.prisma.repurchaseCommissionLedger.aggregate({
                where: { status: client_1.CommissionStatus.PENDING, distributionRecordId: null },
                _sum: { amount: true },
            }),
        ]);
        const membershipGross = Number(membershipGrossSum._sum.amount ?? 0);
        const repurchaseGross = Number(repurchaseGrossSum._sum.amount ?? 0);
        return {
            pendingMembershipLedgersCount: pendingMembershipLedgers,
            pendingRepurchaseLedgersCount: pendingRepurchaseLedgers,
            totalPendingLedgersCount: pendingMembershipLedgers + pendingRepurchaseLedgers,
            membershipGrossAmount: membershipGross,
            repurchaseGrossAmount: repurchaseGross,
            totalGrossAmount: membershipGross + repurchaseGross,
        };
    }
    async getPendingCommissions(query) {
        const { startDate, endDate, memberId, commissionType = 'ALL', page = 1, limit = 10, } = query;
        const dateFilter = this.buildDateWhere(startDate, endDate);
        const memWhere = {
            status: client_1.CommissionStatus.PENDING,
            distributionRecordId: null,
            beneficiaryMember: {
                isCommissionFrozen: false,
            },
            ...(dateFilter ? { createdAt: dateFilter } : {}),
            ...(memberId ? { beneficiaryMemberId: memberId } : {}),
        };
        const repWhere = {
            status: client_1.CommissionStatus.PENDING,
            distributionRecordId: null,
            beneficiaryMember: {
                isCommissionFrozen: false,
            },
            ...(dateFilter ? { createdAt: dateFilter } : {}),
            ...(memberId ? { beneficiaryMemberId: memberId } : {}),
        };
        const fetchMembership = commissionType === 'ALL' || commissionType === 'MEMBERSHIP';
        const fetchRepurchase = commissionType === 'ALL' || commissionType === 'REPURCHASE';
        const [memLedgers, repLedgers] = await Promise.all([
            fetchMembership
                ? this.prisma.membershipCommissionLedger.findMany({
                    where: memWhere,
                    include: {
                        beneficiaryMember: {
                            select: {
                                id: true,
                                memberCode: true,
                                name: true,
                                mobile: true,
                                email: true,
                                bankDetails: true,
                                status: true,
                            },
                        },
                    },
                })
                : Promise.resolve([]),
            fetchRepurchase
                ? this.prisma.repurchaseCommissionLedger.findMany({
                    where: repWhere,
                    include: {
                        beneficiaryMember: {
                            select: {
                                id: true,
                                memberCode: true,
                                name: true,
                                mobile: true,
                                email: true,
                                bankDetails: true,
                                status: true,
                            },
                        },
                    },
                })
                : Promise.resolve([]),
        ]);
        const memberMap = new Map();
        for (const l of memLedgers) {
            const bId = l.beneficiaryMemberId;
            if (!memberMap.has(bId)) {
                memberMap.set(bId, {
                    member: l.beneficiaryMember,
                    membershipLedgers: [],
                    repurchaseLedgers: [],
                    membershipGrossAmount: 0,
                    repurchaseGrossAmount: 0,
                });
            }
            const entry = memberMap.get(bId);
            entry.membershipLedgers.push({
                ...l,
                amount: Number(l.amount),
                percentage: Number(l.percentage),
            });
            entry.membershipGrossAmount += Number(l.amount);
        }
        for (const l of repLedgers) {
            const bId = l.beneficiaryMemberId;
            if (!memberMap.has(bId)) {
                memberMap.set(bId, {
                    member: l.beneficiaryMember,
                    membershipLedgers: [],
                    repurchaseLedgers: [],
                    membershipGrossAmount: 0,
                    repurchaseGrossAmount: 0,
                });
            }
            const entry = memberMap.get(bId);
            entry.repurchaseLedgers.push({
                ...l,
                amount: Number(l.amount),
                percentage: Number(l.percentage),
            });
            entry.repurchaseGrossAmount += Number(l.amount);
        }
        const allBeneficiaryEntries = Array.from(memberMap.values());
        const totalMembers = allBeneficiaryEntries.length;
        const isTdsEnabled = this.systemSettingsService
            ? await this.systemSettingsService.isTdsEnabled()
            : true;
        const formattedData = allBeneficiaryEntries.map((item) => {
            const grossAmount = Math.round((item.membershipGrossAmount + item.repurchaseGrossAmount) * 100) / 100;
            const tdsAmount = isTdsEnabled
                ? Math.round(grossAmount * 0.05 * 100) / 100
                : 0;
            const adminFee = isTdsEnabled
                ? Math.round(grossAmount * 0.05 * 100) / 100
                : 0;
            const netAmount = Math.round((grossAmount - tdsAmount - adminFee) * 100) / 100;
            return {
                member: item.member,
                membershipPendingCount: item.membershipLedgers.length,
                membershipGrossAmount: Math.round(item.membershipGrossAmount * 100) / 100,
                repurchasePendingCount: item.repurchaseLedgers.length,
                repurchaseGrossAmount: Math.round(item.repurchaseGrossAmount * 100) / 100,
                totalLedgerCount: item.membershipLedgers.length + item.repurchaseLedgers.length,
                grossAmount,
                tdsAmount,
                adminFee,
                netAmount,
                membershipLedgerIds: item.membershipLedgers.map((l) => l.id),
                repurchaseLedgerIds: item.repurchaseLedgers.map((l) => l.id),
            };
        });
        let totalGrossAmount = 0;
        let totalTdsAmount = 0;
        let totalAdminFee = 0;
        let totalNetAmount = 0;
        formattedData.forEach((row) => {
            totalGrossAmount += row.grossAmount;
            totalTdsAmount += row.tdsAmount;
            totalAdminFee += row.adminFee;
            totalNetAmount += row.netAmount;
        });
        const skip = (page - 1) * limit;
        const paginatedData = formattedData.slice(skip, skip + limit);
        return {
            data: paginatedData,
            meta: {
                total: totalMembers,
                page,
                limit,
                totalPages: Math.ceil(totalMembers / limit),
            },
            summary: {
                totalBeneficiaries: totalMembers,
                totalGrossAmount: Math.round(totalGrossAmount * 100) / 100,
                totalTdsAmount: Math.round(totalTdsAmount * 100) / 100,
                totalAdminFee: Math.round(totalAdminFee * 100) / 100,
                totalNetAmount: Math.round(totalNetAmount * 100) / 100,
            },
        };
    }
    async processDistributionBatch(dto, actorId, actorRole) {
        const { remarks } = dto;
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const batchCountToday = await this.prisma.distributionBatch.count({
            where: {
                batchNo: { startsWith: `BATCH-${dateStr}` },
            },
        });
        const batchNo = `BATCH-${dateStr}-${(batchCountToday + 1).toString().padStart(4, '0')}`;
        const batch = await this.prisma.distributionBatch.create({
            data: {
                batchNo,
                totalMembers: 0,
                status: client_1.DistributionBatchStatus.INITIATED,
                processedBy: actorId || null,
                remarks: remarks || null,
                startedAt: new Date(),
            },
        });
        await this.auditService.logAction({
            actorId: actorId || null,
            actorRole: actorRole || client_1.MemberRole.ADMIN,
            actionType: 'CREATE_DISTRIBUTION_BATCH',
            entityType: 'DistributionBatch',
            entityId: batch.id,
            metadata: {
                batchNo: batch.batchNo,
                status: batch.status,
            },
        });
        if (this.distributionQueue) {
            try {
                await this.distributionQueue.add('process-batch', {
                    batchId: batch.id,
                    ...dto,
                    actorId,
                    actorRole,
                });
                this.logger.log(`Enqueued distribution batch '${batch.batchNo}' (${batch.id}) to Bull queue.`);
                return {
                    id: batch.id,
                    batchNo: batch.batchNo,
                    status: client_1.DistributionBatchStatus.INITIATED,
                    message: `Distribution batch '${batch.batchNo}' initiated and enqueued for background processing.`,
                    processedBy: batch.processedBy,
                    createdAt: batch.createdAt,
                };
            }
            catch (err) {
                this.logger.warn(`Bull queue dispatch failed (${err.message}). Executing inline fallback.`);
            }
        }
        return this.executeBatchProcessing(batch.id, dto, actorId, actorRole);
    }
    async executeBatchProcessing(batchId, dto, actorId, actorRole) {
        const { cutoffDate, membershipLedgerIds, repurchaseLedgerIds, memberIds } = dto;
        const dateFilter = cutoffDate ? { lte: new Date(cutoffDate) } : undefined;
        return this.prisma.$transaction(async (tx) => {
            await tx.distributionBatch.update({
                where: { id: batchId },
                data: { status: client_1.DistributionBatchStatus.PROCESSING },
            });
            const memWhere = {
                status: client_1.CommissionStatus.PENDING,
                distributionRecordId: null,
                ...(dateFilter ? { createdAt: dateFilter } : {}),
                ...(membershipLedgerIds && membershipLedgerIds.length > 0
                    ? { id: { in: membershipLedgerIds } }
                    : {}),
                ...(memberIds && memberIds.length > 0
                    ? { beneficiaryMemberId: { in: memberIds } }
                    : {}),
            };
            const repWhere = {
                status: client_1.CommissionStatus.PENDING,
                distributionRecordId: null,
                ...(dateFilter ? { createdAt: dateFilter } : {}),
                ...(repurchaseLedgerIds && repurchaseLedgerIds.length > 0
                    ? { id: { in: repurchaseLedgerIds } }
                    : {}),
                ...(memberIds && memberIds.length > 0
                    ? { beneficiaryMemberId: { in: memberIds } }
                    : {}),
            };
            const [memLedgers, repLedgers] = await Promise.all([
                tx.membershipCommissionLedger.findMany({ where: memWhere }),
                tx.repurchaseCommissionLedger.findMany({ where: repWhere }),
            ]);
            if (memLedgers.length === 0 && repLedgers.length === 0) {
                await tx.distributionBatch.update({
                    where: { id: batchId },
                    data: {
                        status: client_1.DistributionBatchStatus.FAILED,
                        remarks: 'No pending ledgers matched criteria',
                    },
                });
                throw new common_1.BadRequestException('No pending commission ledgers match the selected distribution criteria.');
            }
            const memberGroupMap = new Map();
            for (const l of memLedgers) {
                const bId = l.beneficiaryMemberId;
                if (!memberGroupMap.has(bId)) {
                    memberGroupMap.set(bId, {
                        membershipLedgers: [],
                        repurchaseLedgers: [],
                        grossAmount: 0,
                    });
                }
                const g = memberGroupMap.get(bId);
                g.membershipLedgers.push(l);
                g.grossAmount += Number(l.amount);
            }
            for (const l of repLedgers) {
                const bId = l.beneficiaryMemberId;
                if (!memberGroupMap.has(bId)) {
                    memberGroupMap.set(bId, {
                        membershipLedgers: [],
                        repurchaseLedgers: [],
                        grossAmount: 0,
                    });
                }
                const g = memberGroupMap.get(bId);
                g.repurchaseLedgers.push(l);
                g.grossAmount += Number(l.amount);
            }
            let batchTotalGross = 0;
            let batchTotalTds = 0;
            let batchTotalAdminFee = 0;
            let batchTotalNet = 0;
            const notificationParamsList = [];
            const isTdsEnabled = this.systemSettingsService
                ? await this.systemSettingsService.isTdsEnabled()
                : true;
            for (const [bId, group] of memberGroupMap.entries()) {
                const grossAmount = Math.round(group.grossAmount * 100) / 100;
                const tdsAmount = isTdsEnabled
                    ? Math.round(grossAmount * 0.05 * 100) / 100
                    : 0;
                const adminFee = isTdsEnabled
                    ? Math.round(grossAmount * 0.05 * 100) / 100
                    : 0;
                const netAmount = Math.round((grossAmount - tdsAmount - adminFee) * 100) / 100;
                batchTotalGross += grossAmount;
                batchTotalTds += tdsAmount;
                batchTotalAdminFee += adminFee;
                batchTotalNet += netAmount;
                const memberInfo = await tx.member.findUnique({
                    where: { id: bId },
                    select: {
                        id: true,
                        memberCode: true,
                        name: true,
                        mobile: true,
                        email: true,
                        bankDetails: true,
                    },
                });
                const commissionType = group.membershipLedgers.length > 0 &&
                    group.repurchaseLedgers.length > 0
                    ? 'COMBINED'
                    : group.membershipLedgers.length > 0
                        ? 'MEMBERSHIP'
                        : 'REPURCHASE';
                const record = await tx.distributionRecord.create({
                    data: {
                        batchId,
                        memberId: bId,
                        commissionType,
                        grossAmount: new client_1.Prisma.Decimal(grossAmount),
                        tdsAmount: new client_1.Prisma.Decimal(tdsAmount),
                        adminFee: new client_1.Prisma.Decimal(adminFee),
                        netAmount: new client_1.Prisma.Decimal(netAmount),
                        paymentMode: client_1.PaymentMode.UPI,
                        bankDetails: memberInfo?.bankDetails || client_1.Prisma.DbNull,
                        status: client_1.DistributionRecordStatus.PAID,
                        disbursedAt: new Date(),
                    },
                });
                if (group.membershipLedgers.length > 0) {
                    const memIds = group.membershipLedgers.map((l) => l.id);
                    await tx.membershipCommissionLedger.updateMany({
                        where: { id: { in: memIds } },
                        data: {
                            distributionRecordId: record.id,
                            status: client_1.CommissionStatus.DISBURSED,
                        },
                    });
                }
                if (group.repurchaseLedgers.length > 0) {
                    const repIds = group.repurchaseLedgers.map((l) => l.id);
                    await tx.repurchaseCommissionLedger.updateMany({
                        where: { id: { in: repIds } },
                        data: {
                            distributionRecordId: record.id,
                            status: client_1.CommissionStatus.DISBURSED,
                        },
                    });
                }
                if (memberInfo) {
                    notificationParamsList.push({
                        memberId: memberInfo.id,
                        memberCode: memberInfo.memberCode,
                        memberName: memberInfo.name,
                        mobile: memberInfo.mobile,
                        email: memberInfo.email,
                        grossAmount,
                        tdsAmount,
                        adminFee,
                        netAmount,
                    });
                }
            }
            const completedBatch = await tx.distributionBatch.update({
                where: { id: batchId },
                data: {
                    totalMembers: memberGroupMap.size,
                    totalGrossAmount: new client_1.Prisma.Decimal(Math.round(batchTotalGross * 100) / 100),
                    totalTdsAmount: new client_1.Prisma.Decimal(Math.round(batchTotalTds * 100) / 100),
                    totalAdminFee: new client_1.Prisma.Decimal(Math.round(batchTotalAdminFee * 100) / 100),
                    totalNetAmount: new client_1.Prisma.Decimal(Math.round(batchTotalNet * 100) / 100),
                    status: client_1.DistributionBatchStatus.COMPLETED,
                    completedAt: new Date(),
                },
                include: {
                    records: {
                        include: {
                            member: {
                                select: {
                                    id: true,
                                    memberCode: true,
                                    name: true,
                                    mobile: true,
                                },
                            },
                        },
                    },
                },
            });
            if (notificationParamsList.length > 0) {
                Promise.allSettled(notificationParamsList.map((n) => this.notificationsService.notifyMemberCommissionDistributed({
                    ...n,
                    batchNo: completedBatch.batchNo,
                }))).catch((notifyErr) => {
                    this.logger.error(`Error dispatching member distribution notifications for batch '${completedBatch.batchNo}': ${notifyErr.message}`);
                });
            }
            await this.auditService.logAction({
                actorId: actorId || null,
                actorRole: actorRole || client_1.MemberRole.ADMIN,
                actionType: 'PROCESS_DISTRIBUTION_BATCH',
                entityType: 'DistributionBatch',
                entityId: completedBatch.id,
                metadata: {
                    batchNo: completedBatch.batchNo,
                    totalMembers: completedBatch.totalMembers,
                    totalGrossAmount: Number(completedBatch.totalGrossAmount),
                    totalNetAmount: Number(completedBatch.totalNetAmount),
                },
            });
            return {
                id: completedBatch.id,
                batchNo: completedBatch.batchNo,
                totalMembers: completedBatch.totalMembers,
                totalGrossAmount: Number(completedBatch.totalGrossAmount),
                totalTdsAmount: Number(completedBatch.totalTdsAmount),
                totalAdminFee: Number(completedBatch.totalAdminFee),
                totalNetAmount: Number(completedBatch.totalNetAmount),
                status: completedBatch.status,
                processedBy: completedBatch.processedBy,
                startedAt: completedBatch.startedAt,
                completedAt: completedBatch.completedAt,
                records: completedBatch.records.map((r) => ({
                    id: r.id,
                    memberId: r.memberId,
                    member: r.member,
                    commissionType: r.commissionType,
                    grossAmount: Number(r.grossAmount),
                    tdsAmount: Number(r.tdsAmount),
                    adminFee: Number(r.adminFee),
                    netAmount: Number(r.netAmount),
                    status: r.status,
                })),
            };
        });
    }
    async getBatchHistory(query) {
        const { startDate, endDate, status, search, page = 1, limit = 10 } = query;
        const skip = (page - 1) * limit;
        const where = {};
        const dateFilter = this.buildDateWhere(startDate, endDate);
        if (dateFilter) {
            where.createdAt = dateFilter;
        }
        if (status) {
            where.status = status;
        }
        if (search && search.trim() !== '') {
            const term = search.trim();
            where.OR = [
                { batchNo: { contains: term, mode: 'insensitive' } },
                { remarks: { contains: term, mode: 'insensitive' } },
            ];
        }
        const [total, batches] = await Promise.all([
            this.prisma.distributionBatch.count({ where }),
            this.prisma.distributionBatch.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    processor: { select: { id: true, memberCode: true, name: true } },
                    records: {
                        include: {
                            member: {
                                select: {
                                    id: true,
                                    memberCode: true,
                                    name: true,
                                    mobile: true,
                                    email: true,
                                    bankDetails: true,
                                },
                            },
                        },
                    },
                },
            }),
        ]);
        const data = batches.map((b) => ({
            id: b.id,
            batchNo: b.batchNo,
            totalMembers: b.totalMembers,
            totalGrossAmount: Number(b.totalGrossAmount),
            totalTdsAmount: Number(b.totalTdsAmount),
            totalAdminFee: Number(b.totalAdminFee),
            totalNetAmount: Number(b.totalNetAmount),
            status: b.status,
            processedBy: b.processedBy,
            processor: b.processor,
            startedAt: b.startedAt,
            completedAt: b.completedAt,
            createdAt: b.createdAt,
            records: b.records
                ? b.records.map((r) => ({
                    id: r.id,
                    memberId: r.memberId,
                    member: r.member,
                    commissionType: r.commissionType,
                    grossAmount: Number(r.grossAmount),
                    tdsAmount: Number(r.tdsAmount),
                    adminFee: Number(r.adminFee),
                    netAmount: Number(r.netAmount),
                    status: r.status,
                }))
                : [],
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
    async getBatchById(batchId) {
        const batch = await this.prisma.distributionBatch.findFirst({
            where: {
                OR: [{ id: batchId }, { batchNo: batchId }],
            },
            include: {
                processor: {
                    select: { id: true, memberCode: true, name: true, email: true },
                },
                records: {
                    include: {
                        member: {
                            select: {
                                id: true,
                                memberCode: true,
                                name: true,
                                mobile: true,
                                email: true,
                            },
                        },
                        membershipCommissions: {
                            select: {
                                id: true,
                                sourceMemberId: true,
                                level: true,
                                percentage: true,
                                amount: true,
                                createdAt: true,
                            },
                        },
                        repurchaseCommissions: {
                            select: {
                                id: true,
                                repurchaseEntryId: true,
                                sourceMemberId: true,
                                level: true,
                                percentage: true,
                                amount: true,
                                createdAt: true,
                            },
                        },
                    },
                },
            },
        });
        if (!batch) {
            throw new common_1.NotFoundException(`Distribution batch '${batchId}' not found`);
        }
        return {
            id: batch.id,
            batchNo: batch.batchNo,
            totalMembers: batch.totalMembers,
            totalGrossAmount: Number(batch.totalGrossAmount),
            totalTdsAmount: Number(batch.totalTdsAmount),
            totalAdminFee: Number(batch.totalAdminFee),
            totalNetAmount: Number(batch.totalNetAmount),
            status: batch.status,
            processedBy: batch.processedBy,
            processor: batch.processor,
            remarks: batch.remarks,
            startedAt: batch.startedAt,
            completedAt: batch.completedAt,
            createdAt: batch.createdAt,
            records: batch.records.map((r) => ({
                id: r.id,
                memberId: r.memberId,
                member: r.member,
                commissionType: r.commissionType,
                grossAmount: Number(r.grossAmount),
                tdsAmount: Number(r.tdsAmount),
                adminFee: Number(r.adminFee),
                netAmount: Number(r.netAmount),
                paymentMode: r.paymentMode,
                paymentRef: r.paymentRef,
                bankDetails: r.bankDetails,
                status: r.status,
                membershipCommissions: r.membershipCommissions.map((m) => ({
                    ...m,
                    amount: Number(m.amount),
                    percentage: Number(m.percentage),
                })),
                repurchaseCommissions: r.repurchaseCommissions.map((rc) => ({
                    ...rc,
                    amount: Number(rc.amount),
                    percentage: Number(rc.percentage),
                })),
            })),
        };
    }
};
exports.DistributionService = DistributionService;
exports.DistributionService = DistributionService = DistributionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(3, (0, common_1.Optional)()),
    __param(4, (0, common_1.Optional)()),
    __param(4, (0, bull_1.InjectQueue)('distribution-queue')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        notifications_service_1.NotificationsService,
        system_settings_service_1.SystemSettingsService, Object])
], DistributionService);
//# sourceMappingURL=distribution.service.js.map