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
var DashboardService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const dashboard_cache_service_1 = require("./dashboard-cache.service");
const query_activity_dto_1 = require("./dto/query-activity.dto");
const client_1 = require("@prisma/client");
let DashboardService = DashboardService_1 = class DashboardService {
    prisma;
    cacheService;
    logger = new common_1.Logger(DashboardService_1.name);
    constructor(prisma, cacheService) {
        this.prisma = prisma;
        this.cacheService = cacheService;
    }
    getDateBoundaries() {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const dayOfWeek = now.getDay();
        const distanceToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - distanceToMonday);
        weekStart.setHours(0, 0, 0, 0);
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        return { now, todayStart, weekStart, monthStart };
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
    async getMemberStats(query) {
        const cacheKey = `admin:dashboard:members:${JSON.stringify(query)}`;
        if (!query.refresh) {
            const cached = await this.cacheService.get(cacheKey);
            if (cached) {
                return cached;
            }
        }
        const { todayStart, weekStart, monthStart } = this.getDateBoundaries();
        const where = {};
        const dateFilter = this.buildDateWhere(query.startDate, query.endDate);
        if (dateFilter) {
            where.joiningDate = dateFilter;
        }
        const [totalMembers, joinedToday, joinedThisWeek, joinedThisMonth, statusGroups] = await Promise.all([
            this.prisma.member.count({ where }),
            this.prisma.member.count({
                where: { ...where, joiningDate: { gte: todayStart } },
            }),
            this.prisma.member.count({
                where: { ...where, joiningDate: { gte: weekStart } },
            }),
            this.prisma.member.count({
                where: { ...where, joiningDate: { gte: monthStart } },
            }),
            this.prisma.member.groupBy({
                by: ['status'],
                where,
                _count: { id: true },
            }),
        ]);
        const statusBreakdown = {
            ACTIVE: 0,
            INACTIVE: 0,
            PENDING: 0,
            BLOCKED: 0,
            SUSPENDED: 0,
        };
        statusGroups.forEach((g) => {
            statusBreakdown[g.status] = g._count.id;
        });
        let registrationTrend = [];
        try {
            if (typeof this.prisma.$queryRaw === 'function') {
                const rawResults = await this.prisma.$queryRaw `
            SELECT 
              DATE_TRUNC('day', joining_date) AS date, 
              COUNT(id)::int AS count
            FROM members
            ${query.startDate || query.endDate
                    ? client_1.Prisma.sql `WHERE joining_date >= ${query.startDate ? new Date(query.startDate) : new Date(0)} 
                   AND joining_date <= ${query.endDate ? new Date(query.endDate) : new Date()}`
                    : client_1.Prisma.empty}
            GROUP BY 1
            ORDER BY 1 ASC
            LIMIT 30
          `;
                registrationTrend = rawResults.map((r) => ({
                    date: r.date instanceof Date ? r.date.toISOString().split('T')[0] : String(r.date).split('T')[0],
                    count: Number(r.count),
                }));
            }
        }
        catch (err) {
            this.logger.debug(`Raw date-trunc query skipped or unsupported in environment: ${err?.message}`);
            registrationTrend = [
                { date: todayStart.toISOString().split('T')[0], count: joinedToday },
            ];
        }
        const result = {
            totalMembers,
            joinedToday,
            joinedThisWeek,
            joinedThisMonth,
            statusBreakdown,
            registrationTrend,
            calculatedAt: new Date().toISOString(),
        };
        await this.cacheService.set(cacheKey, result, 60);
        return result;
    }
    async getEarningsStats(query) {
        const cacheKey = `admin:dashboard:earnings:${JSON.stringify(query)}`;
        if (!query.refresh) {
            const cached = await this.cacheService.get(cacheKey);
            if (cached) {
                return cached;
            }
        }
        const createdAtFilter = this.buildDateWhere(query.startDate, query.endDate);
        const membershipWhere = {};
        const repurchaseWhere = {};
        const distributionWhere = {};
        if (createdAtFilter) {
            membershipWhere.createdAt = createdAtFilter;
            repurchaseWhere.createdAt = createdAtFilter;
            distributionWhere.createdAt = createdAtFilter;
        }
        const [membershipGroups, repurchaseGroups, disbursedRecordSum, pendingRecordSum,] = await Promise.all([
            this.prisma.membershipCommissionLedger.groupBy({
                by: ['status'],
                where: membershipWhere,
                _sum: { amount: true },
                _count: { id: true },
            }),
            this.prisma.repurchaseCommissionLedger.groupBy({
                by: ['status'],
                where: repurchaseWhere,
                _sum: { amount: true },
                _count: { id: true },
            }),
            this.prisma.distributionRecord.aggregate({
                where: { ...distributionWhere, status: client_1.DistributionRecordStatus.PAID },
                _sum: { netAmount: true, grossAmount: true, tdsAmount: true, adminFee: true },
                _count: { id: true },
            }),
            this.prisma.distributionRecord.aggregate({
                where: { ...distributionWhere, status: client_1.DistributionRecordStatus.PENDING },
                _sum: { netAmount: true, grossAmount: true },
                _count: { id: true },
            }),
        ]);
        let totalMembershipEarnings = 0;
        const membershipBreakdown = {
            DISBURSED: 0,
            PENDING: 0,
            HOLD: 0,
            CANCELLED: 0,
        };
        membershipGroups.forEach((g) => {
            const sum = Number(g._sum.amount ?? 0);
            totalMembershipEarnings += sum;
            if (g.status in membershipBreakdown) {
                membershipBreakdown[g.status] = sum;
            }
        });
        let totalRepurchaseEarnings = 0;
        const repurchaseBreakdown = {
            DISBURSED: 0,
            PENDING: 0,
            HOLD: 0,
            CANCELLED: 0,
        };
        repurchaseGroups.forEach((g) => {
            const sum = Number(g._sum.amount ?? 0);
            totalRepurchaseEarnings += sum;
            if (g.status in repurchaseBreakdown) {
                repurchaseBreakdown[g.status] = sum;
            }
        });
        const totalEarnings = totalMembershipEarnings + totalRepurchaseEarnings;
        const totalDistributed = Number(disbursedRecordSum._sum.netAmount ?? 0);
        const totalGrossDistributed = Number(disbursedRecordSum._sum.grossAmount ?? 0);
        const totalTdsDeducted = Number(disbursedRecordSum._sum.tdsAmount ?? 0);
        const totalAdminFeeDeducted = Number(disbursedRecordSum._sum.adminFee ?? 0);
        const pendingLedgersAmount = membershipBreakdown.PENDING + repurchaseBreakdown.PENDING;
        const pendingRecordsAmount = Number(pendingRecordSum._sum.netAmount ?? 0);
        const pendingDistributions = pendingLedgersAmount + pendingRecordsAmount;
        const result = {
            totalMembershipEarnings,
            totalRepurchaseEarnings,
            totalEarnings,
            totalDistributed,
            totalGrossDistributed,
            totalTdsDeducted,
            totalAdminFeeDeducted,
            pendingDistributions,
            membershipEarningsBreakdown: membershipBreakdown,
            repurchaseEarningsBreakdown: repurchaseBreakdown,
            distributionSummary: {
                totalPaidRecordsCount: disbursedRecordSum._count.id,
                totalPendingRecordsCount: pendingRecordSum._count.id,
                pendingLedgersAmount,
                pendingRecordsAmount,
            },
            calculatedAt: new Date().toISOString(),
        };
        await this.cacheService.set(cacheKey, result, 60);
        return result;
    }
    async getBusinessStats(query) {
        const cacheKey = `admin:dashboard:business:${JSON.stringify(query)}`;
        if (!query.refresh) {
            const cached = await this.cacheService.get(cacheKey);
            if (cached) {
                return cached;
            }
        }
        const { todayStart, weekStart, monthStart } = this.getDateBoundaries();
        const repurchaseWhere = { deletedAt: null };
        const dateFilter = this.buildDateWhere(query.startDate, query.endDate);
        if (dateFilter) {
            repurchaseWhere.transactionDate = dateFilter;
        }
        const [repurchaseCount, repurchaseVolumeAggregate, todayVolumeAggregate, weekVolumeAggregate, monthVolumeAggregate, memberStats, earningsStats,] = await Promise.all([
            this.prisma.repurchaseEntry.count({ where: repurchaseWhere }),
            this.prisma.repurchaseEntry.aggregate({
                where: repurchaseWhere,
                _sum: { amount: true },
            }),
            this.prisma.repurchaseEntry.aggregate({
                where: { ...repurchaseWhere, transactionDate: { gte: todayStart } },
                _sum: { amount: true },
            }),
            this.prisma.repurchaseEntry.aggregate({
                where: { ...repurchaseWhere, transactionDate: { gte: weekStart } },
                _sum: { amount: true },
            }),
            this.prisma.repurchaseEntry.aggregate({
                where: { ...repurchaseWhere, transactionDate: { gte: monthStart } },
                _sum: { amount: true },
            }),
            this.getMemberStats(query),
            this.getEarningsStats(query),
        ]);
        const totalRepurchaseVolume = Number(repurchaseVolumeAggregate._sum.amount ?? 0);
        const todayVolume = Number(todayVolumeAggregate._sum.amount ?? 0);
        const weekVolume = Number(weekVolumeAggregate._sum.amount ?? 0);
        const monthVolume = Number(monthVolumeAggregate._sum.amount ?? 0);
        const averageOrderValue = repurchaseCount > 0 ? Number((totalRepurchaseVolume / repurchaseCount).toFixed(2)) : 0;
        const activeMembersCount = memberStats.statusBreakdown.ACTIVE || 0;
        const activationRate = memberStats.totalMembers > 0
            ? Number(((activeMembersCount / memberStats.totalMembers) * 100).toFixed(2))
            : 0;
        const payoutRatio = earningsStats.totalEarnings > 0
            ? Number(((earningsStats.totalDistributed / earningsStats.totalEarnings) * 100).toFixed(2))
            : 0;
        const result = {
            repurchaseSummary: {
                totalOrders: repurchaseCount,
                totalVolume: totalRepurchaseVolume,
                averageOrderValue,
                todayVolume,
                thisWeekVolume: weekVolume,
                thisMonthVolume: monthVolume,
                totalRepurchaseCommissionGenerated: earningsStats.totalRepurchaseEarnings,
            },
            growthSummary: {
                totalMembers: memberStats.totalMembers,
                activeMembers: activeMembersCount,
                activationRate,
                joinedToday: memberStats.joinedToday,
                joinedThisWeek: memberStats.joinedThisWeek,
                joinedThisMonth: memberStats.joinedThisMonth,
                statusBreakdown: memberStats.statusBreakdown,
            },
            earningsSummary: {
                totalMembershipEarnings: earningsStats.totalMembershipEarnings,
                totalRepurchaseEarnings: earningsStats.totalRepurchaseEarnings,
                totalEarnings: earningsStats.totalEarnings,
                totalDistributed: earningsStats.totalDistributed,
                pendingDistributions: earningsStats.pendingDistributions,
                payoutRatio,
            },
            calculatedAt: new Date().toISOString(),
        };
        await this.cacheService.set(cacheKey, result, 60);
        return result;
    }
    async getActivityFeed(query) {
        const cacheKey = `admin:dashboard:activity:${JSON.stringify(query)}`;
        if (!query.refresh) {
            const cached = await this.cacheService.get(cacheKey);
            if (cached) {
                return cached;
            }
        }
        const { type = query_activity_dto_1.ActivityCategory.ALL, page = 1, limit = 10, startDate, endDate } = query;
        const items = [];
        const dateFilter = this.buildDateWhere(startDate, endDate);
        const fetchAll = type === query_activity_dto_1.ActivityCategory.ALL;
        const fetchRegistrations = fetchAll || type === query_activity_dto_1.ActivityCategory.MEMBER_REGISTRATION;
        const fetchRepurchases = fetchAll || type === query_activity_dto_1.ActivityCategory.REPURCHASE;
        const fetchDistributions = fetchAll || type === query_activity_dto_1.ActivityCategory.DISTRIBUTION;
        const fetchSystemActivities = fetchAll || type === query_activity_dto_1.ActivityCategory.SYSTEM_ACTIVITY;
        const promises = [];
        if (fetchRegistrations) {
            promises.push((async () => {
                const members = await this.prisma.member.findMany({
                    where: dateFilter ? { joiningDate: dateFilter } : undefined,
                    take: 50,
                    orderBy: { joiningDate: 'desc' },
                    select: {
                        id: true,
                        memberCode: true,
                        name: true,
                        mobile: true,
                        role: true,
                        status: true,
                        joiningDate: true,
                        referrer: { select: { id: true, memberCode: true, name: true } },
                    },
                });
                members.forEach((m) => {
                    items.push({
                        id: `reg-${m.id}`,
                        category: query_activity_dto_1.ActivityCategory.MEMBER_REGISTRATION,
                        action: `New member registered: ${m.name} (${m.memberCode})`,
                        timestamp: m.joiningDate.toISOString(),
                        actor: m.referrer ? { id: m.referrer.id, memberCode: m.referrer.memberCode, name: m.referrer.name } : null,
                        details: {
                            memberId: m.id,
                            memberCode: m.memberCode,
                            name: m.name,
                            mobile: m.mobile,
                            status: m.status,
                            role: m.role,
                            referrer: m.referrer,
                        },
                    });
                });
            })());
        }
        if (fetchRepurchases) {
            promises.push((async () => {
                const repurchases = await this.prisma.repurchaseEntry.findMany({
                    where: {
                        deletedAt: null,
                        ...(dateFilter ? { transactionDate: dateFilter } : {}),
                    },
                    take: 50,
                    orderBy: { transactionDate: 'desc' },
                    select: {
                        id: true,
                        transactionRef: true,
                        amount: true,
                        transactionDate: true,
                        remarks: true,
                        member: { select: { id: true, memberCode: true, name: true, role: true } },
                    },
                });
                repurchases.forEach((r) => {
                    items.push({
                        id: `rep-${r.id}`,
                        category: query_activity_dto_1.ActivityCategory.REPURCHASE,
                        action: `Repurchase recorded for ${r.member?.name || 'Member'} (${r.member?.memberCode}): ₹${Number(r.amount).toLocaleString('en-IN')}`,
                        timestamp: r.transactionDate.toISOString(),
                        actor: r.member ? { id: r.member.id, memberCode: r.member.memberCode, name: r.member.name, role: r.member.role } : null,
                        details: {
                            repurchaseId: r.id,
                            transactionRef: r.transactionRef,
                            amount: Number(r.amount),
                            remarks: r.remarks,
                        },
                    });
                });
            })());
        }
        if (fetchDistributions) {
            promises.push((async () => {
                const batches = await this.prisma.distributionBatch.findMany({
                    where: dateFilter ? { createdAt: dateFilter } : undefined,
                    take: 50,
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true,
                        batchNo: true,
                        totalMembers: true,
                        totalGrossAmount: true,
                        totalNetAmount: true,
                        status: true,
                        createdAt: true,
                        completedAt: true,
                        processor: { select: { id: true, memberCode: true, name: true, role: true } },
                    },
                });
                batches.forEach((b) => {
                    const time = b.completedAt || b.createdAt;
                    items.push({
                        id: `dist-${b.id}`,
                        category: query_activity_dto_1.ActivityCategory.DISTRIBUTION,
                        action: `Payout Batch ${b.batchNo} (${b.status}): Net ₹${Number(b.totalNetAmount).toLocaleString('en-IN')} for ${b.totalMembers} members`,
                        timestamp: time.toISOString(),
                        actor: b.processor ? { id: b.processor.id, memberCode: b.processor.memberCode, name: b.processor.name, role: b.processor.role } : null,
                        details: {
                            batchId: b.id,
                            batchNo: b.batchNo,
                            status: b.status,
                            totalMembers: b.totalMembers,
                            totalGrossAmount: Number(b.totalGrossAmount),
                            totalNetAmount: Number(b.totalNetAmount),
                        },
                    });
                });
            })());
        }
        if (fetchSystemActivities) {
            promises.push((async () => {
                const logs = await this.prisma.activityLog.findMany({
                    where: dateFilter ? { createdAt: dateFilter } : undefined,
                    take: 50,
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true,
                        actionType: true,
                        entityType: true,
                        entityId: true,
                        actorRole: true,
                        metadata: true,
                        createdAt: true,
                        actor: { select: { id: true, memberCode: true, name: true, role: true } },
                    },
                });
                logs.forEach((l) => {
                    items.push({
                        id: `sys-${l.id}`,
                        category: query_activity_dto_1.ActivityCategory.SYSTEM_ACTIVITY,
                        action: `System Activity: ${l.actionType} on ${l.entityType}${l.entityId ? ':' + l.entityId : ''}`,
                        timestamp: l.createdAt.toISOString(),
                        actor: l.actor ? { id: l.actor.id, memberCode: l.actor.memberCode, name: l.actor.name, role: l.actor.role || l.actorRole } : null,
                        details: {
                            actionType: l.actionType,
                            entityType: l.entityType,
                            entityId: l.entityId,
                            metadata: l.metadata,
                        },
                    });
                });
            })());
        }
        await Promise.all(promises);
        items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        const total = items.length;
        const skip = (page - 1) * limit;
        const paginatedItems = items.slice(skip, skip + limit);
        const result = {
            data: paginatedItems,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit) || 1,
            },
            calculatedAt: new Date().toISOString(),
        };
        await this.cacheService.set(cacheKey, result, 60);
        return result;
    }
    async getMemberPersonalDashboard(memberId, refresh) {
        const cacheKey = `member:dashboard:${memberId}`;
        if (!refresh) {
            const cached = await this.cacheService.get(cacheKey);
            if (cached) {
                return cached;
            }
        }
        const member = await this.prisma.member.findUnique({
            where: { id: memberId },
            select: {
                id: true,
                memberCode: true,
                name: true,
                email: true,
                mobile: true,
                status: true,
                role: true,
                joiningDate: true,
                referrer: { select: { id: true, memberCode: true, name: true } },
            },
        });
        if (!member) {
            throw new common_1.NotFoundException(`Member with ID '${memberId}' not found`);
        }
        const [directReferralsCount, activeDirectReferralsCount, membershipGroups, repurchaseGroups, recentMembershipLedgers, recentRepurchaseLedgers,] = await Promise.all([
            this.prisma.member.count({ where: { referrerId: memberId } }),
            this.prisma.member.count({ where: { referrerId: memberId, status: client_1.MemberStatus.ACTIVE } }),
            this.prisma.membershipCommissionLedger.groupBy({
                by: ['status'],
                where: { beneficiaryMemberId: memberId },
                _sum: { amount: true },
            }),
            this.prisma.repurchaseCommissionLedger.groupBy({
                by: ['status'],
                where: { beneficiaryMemberId: memberId },
                _sum: { amount: true },
            }),
            this.prisma.membershipCommissionLedger.findMany({
                where: { beneficiaryMemberId: memberId },
                take: 5,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    amount: true,
                    level: true,
                    status: true,
                    createdAt: true,
                    sourceMember: { select: { id: true, memberCode: true, name: true } },
                },
            }),
            this.prisma.repurchaseCommissionLedger.findMany({
                where: { beneficiaryMemberId: memberId },
                take: 5,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    amount: true,
                    level: true,
                    status: true,
                    createdAt: true,
                    sourceMember: { select: { id: true, memberCode: true, name: true } },
                },
            }),
        ]);
        let totalDownlineMembers = directReferralsCount;
        let activeDownlineMembers = activeDirectReferralsCount;
        try {
            if (typeof this.prisma.$queryRaw === 'function') {
                const downlineNodes = await this.prisma.$queryRaw `
          WITH RECURSIVE downline AS (
            SELECT id, status, 1 AS level
            FROM members
            WHERE referrer_id = ${memberId}

            UNION ALL

            SELECT m.id, m.status, d.level + 1
            FROM members m
            INNER JOIN downline d ON m.referrer_id = d.id
            WHERE d.level < 20
          )
          SELECT id, status FROM downline;
        `;
                totalDownlineMembers = downlineNodes.length;
                activeDownlineMembers = downlineNodes.filter((n) => n.status === client_1.MemberStatus.ACTIVE).length;
            }
        }
        catch (err) {
            this.logger.debug(`Downline CTE query skipped or error: ${err?.message}`);
        }
        let membershipEarnings = 0;
        const membershipBreakdown = {
            DISBURSED: 0,
            PENDING: 0,
            HOLD: 0,
            CANCELLED: 0,
        };
        membershipGroups.forEach((g) => {
            const sum = Number(g._sum?.amount ?? 0);
            membershipEarnings += sum;
            if (g.status in membershipBreakdown) {
                membershipBreakdown[g.status] = sum;
            }
        });
        let repurchaseEarnings = 0;
        const repurchaseBreakdown = {
            DISBURSED: 0,
            PENDING: 0,
            HOLD: 0,
            CANCELLED: 0,
        };
        repurchaseGroups.forEach((g) => {
            const sum = Number(g._sum?.amount ?? 0);
            repurchaseEarnings += sum;
            if (g.status in repurchaseBreakdown) {
                repurchaseBreakdown[g.status] = sum;
            }
        });
        const totalEarnings = membershipEarnings + repurchaseEarnings;
        const totalDisbursed = (membershipBreakdown.DISBURSED || 0) + (repurchaseBreakdown.DISBURSED || 0);
        const totalPending = (membershipBreakdown.PENDING || 0) + (repurchaseBreakdown.PENDING || 0);
        const recentCommissions = [];
        recentMembershipLedgers.forEach((m) => {
            recentCommissions.push({
                id: m.id,
                type: 'MEMBERSHIP',
                amount: Number(m.amount),
                level: m.level,
                status: m.status,
                sourceMember: m.sourceMember,
                createdAt: m.createdAt.toISOString(),
            });
        });
        recentRepurchaseLedgers.forEach((r) => {
            recentCommissions.push({
                id: r.id,
                type: 'REPURCHASE',
                amount: Number(r.amount),
                level: r.level,
                status: r.status,
                sourceMember: r.sourceMember,
                createdAt: r.createdAt.toISOString(),
            });
        });
        recentCommissions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        const topRecentCommissions = recentCommissions.slice(0, 5);
        const result = {
            memberInfo: {
                id: member.id,
                memberCode: member.memberCode,
                name: member.name,
                email: member.email,
                mobile: member.mobile,
                status: member.status,
                role: member.role,
                joiningDate: member.joiningDate.toISOString(),
                referrer: member.referrer,
            },
            referrals: {
                totalDirectReferrals: directReferralsCount,
                activeDirectReferrals: activeDirectReferralsCount,
                totalDownlineMembers,
                activeDownlineMembers,
            },
            earnings: {
                membershipEarnings,
                repurchaseEarnings,
                totalEarnings,
                totalDisbursed,
                totalPending,
                membershipBreakdown,
                repurchaseBreakdown,
            },
            recentCommissions: topRecentCommissions,
            calculatedAt: new Date().toISOString(),
        };
        await this.cacheService.set(cacheKey, result, 60);
        return result;
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = DashboardService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        dashboard_cache_service_1.DashboardCacheService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map