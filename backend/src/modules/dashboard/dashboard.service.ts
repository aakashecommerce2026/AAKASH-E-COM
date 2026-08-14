import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DashboardCacheService } from './dashboard-cache.service';
import { QueryDashboardDto } from './dto/query-dashboard.dto';
import { QueryActivityDto, ActivityCategory } from './dto/query-activity.dto';
import { MemberStatus, CommissionStatus, DistributionRecordStatus, Prisma } from '@prisma/client';

export interface IMemberStatsResponse {
  totalMembers: number;
  joinedToday: number;
  joinedThisWeek: number;
  joinedThisMonth: number;
  statusBreakdown: Record<MemberStatus, number>;
  registrationTrend: Array<{ date: string; count: number }>;
  calculatedAt: string;
}

export interface IEarningsStatsResponse {
  totalMembershipEarnings: number;
  totalRepurchaseEarnings: number;
  totalEarnings: number;
  totalDistributed: number;
  totalGrossDistributed: number;
  totalTdsDeducted: number;
  totalAdminFeeDeducted: number;
  pendingDistributions: number;
  membershipEarningsBreakdown: Record<string, number>;
  repurchaseEarningsBreakdown: Record<string, number>;
  distributionSummary: {
    totalPaidRecordsCount: number;
    totalPendingRecordsCount: number;
    pendingLedgersAmount: number;
    pendingRecordsAmount: number;
  };
  calculatedAt: string;
}

export interface IBusinessStatsResponse {
  repurchaseSummary: {
    totalOrders: number;
    totalVolume: number;
    averageOrderValue: number;
    todayVolume: number;
    thisWeekVolume: number;
    thisMonthVolume: number;
    totalRepurchaseCommissionGenerated: number;
  };
  growthSummary: {
    totalMembers: number;
    activeMembers: number;
    activationRate: number;
    joinedToday: number;
    joinedThisWeek: number;
    joinedThisMonth: number;
    statusBreakdown: Record<MemberStatus, number>;
  };
  earningsSummary: {
    totalMembershipEarnings: number;
    totalRepurchaseEarnings: number;
    totalEarnings: number;
    totalDistributed: number;
    pendingDistributions: number;
    payoutRatio: number;
  };
  calculatedAt: string;
}

export interface IActivityFeedItem {
  id: string;
  category: ActivityCategory;
  action: string;
  timestamp: string;
  actor: { id: string; memberCode: string; name: string; role?: string } | null;
  details: Record<string, any>;
}

export interface IActivityFeedResponse {
  data: IActivityFeedItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  calculatedAt: string;
}

export interface IMemberPersonalDashboardResponse {
  memberInfo: {
    id: string;
    memberCode: string;
    name: string;
    email: string | null;
    mobile: string;
    status: string;
    role: string;
    joiningDate: string;
    referrer: { id: string; memberCode: string; name: string } | null;
  };
  referrals: {
    totalDirectReferrals: number;
    activeDirectReferrals: number;
    totalDownlineMembers: number;
    activeDownlineMembers: number;
  };
  earnings: {
    membershipEarnings: number;
    repurchaseEarnings: number;
    totalEarnings: number;
    totalDisbursed: number;
    totalPending: number;
    membershipBreakdown: Record<string, number>;
    repurchaseBreakdown: Record<string, number>;
  };
  recentCommissions: Array<{
    id: string;
    type: 'MEMBERSHIP' | 'REPURCHASE';
    amount: number;
    level: number;
    status: string;
    sourceMember: { id: string; memberCode: string; name: string } | null;
    createdAt: string;
  }>;
  calculatedAt: string;
}

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: DashboardCacheService,
  ) {}

  /**
   * Calculate standard date boundaries (Start of Today, Start of Week, Start of Month)
   */
  private getDateBoundaries() {
    const now = new Date();

    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    // Monday as start of week
    const dayOfWeek = now.getDay();
    const distanceToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - distanceToMonday);
    weekStart.setHours(0, 0, 0, 0);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

    return { now, todayStart, weekStart, monthStart };
  }

  /**
   * Helper to build date range filters for Prisma
   */
  private buildDateWhere(startDate?: string, endDate?: string): Prisma.DateTimeFilter | undefined {
    if (!startDate && !endDate) return undefined;

    const dateFilter: Prisma.DateTimeFilter = {};
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

  /**
   * 1. GET /admin/dashboard/members
   * Aggregates total members, joined today/this week/this month with date-truncated queries.
   */
  async getMemberStats(query: QueryDashboardDto): Promise<IMemberStatsResponse> {
    const cacheKey = `admin:dashboard:members:${JSON.stringify(query)}`;

    if (!query.refresh) {
      const cached = await this.cacheService.get<IMemberStatsResponse>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const { todayStart, weekStart, monthStart } = this.getDateBoundaries();
    const where: Prisma.MemberWhereInput = {};

    const dateFilter = this.buildDateWhere(query.startDate, query.endDate);
    if (dateFilter) {
      where.joiningDate = dateFilter;
    }

    const [totalMembers, joinedToday, joinedThisWeek, joinedThisMonth, statusGroups] =
      await Promise.all([
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

    // Build complete status breakdown map with defaults
    const statusBreakdown: Record<MemberStatus, number> = {
      ACTIVE: 0,
      INACTIVE: 0,
      PENDING: 0,
      BLOCKED: 0,
      SUSPENDED: 0,
    };

    statusGroups.forEach((g) => {
      statusBreakdown[g.status] = g._count.id;
    });

    // Execute PostgreSQL date-truncated aggregate registration query (daily breakdown)
    let registrationTrend: Array<{ date: string; count: number }> = [];
    try {
      if (typeof this.prisma.$queryRaw === 'function') {
        const rawResults: Array<{ date: Date | string; count: bigint | number }> =
          await this.prisma.$queryRaw`
            SELECT 
              DATE_TRUNC('day', joining_date) AS date, 
              COUNT(id)::int AS count
            FROM members
            ${
              query.startDate || query.endDate
                ? Prisma.sql`WHERE joining_date >= ${query.startDate ? new Date(query.startDate) : new Date(0)} 
                   AND joining_date <= ${query.endDate ? new Date(query.endDate) : new Date()}`
                : Prisma.empty
            }
            GROUP BY 1
            ORDER BY 1 ASC
            LIMIT 30
          `;

        registrationTrend = rawResults.map((r) => ({
          date: r.date instanceof Date ? r.date.toISOString().split('T')[0] : String(r.date).split('T')[0],
          count: Number(r.count),
        }));
      }
    } catch (err: any) {
      this.logger.debug(`Raw date-trunc query skipped or unsupported in environment: ${err?.message}`);
      registrationTrend = [
        { date: todayStart.toISOString().split('T')[0], count: joinedToday },
      ];
    }

    const result: IMemberStatsResponse = {
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

  /**
   * 2. GET /admin/dashboard/earnings
   * Aggregates total membership earnings, repurchase earnings, total distributed, pending distributions.
   */
  async getEarningsStats(query: QueryDashboardDto): Promise<IEarningsStatsResponse> {
    const cacheKey = `admin:dashboard:earnings:${JSON.stringify(query)}`;

    if (!query.refresh) {
      const cached = await this.cacheService.get<IEarningsStatsResponse>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const createdAtFilter = this.buildDateWhere(query.startDate, query.endDate);

    const membershipWhere: Prisma.MembershipCommissionLedgerWhereInput = {};
    const repurchaseWhere: Prisma.RepurchaseCommissionLedgerWhereInput = {};
    const distributionWhere: Prisma.DistributionRecordWhereInput = {};

    if (createdAtFilter) {
      membershipWhere.createdAt = createdAtFilter;
      repurchaseWhere.createdAt = createdAtFilter;
      distributionWhere.createdAt = createdAtFilter;
    }

    const [
      membershipGroups,
      repurchaseGroups,
      disbursedRecordSum,
      pendingRecordSum,
    ] = await Promise.all([
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
        where: { ...distributionWhere, status: DistributionRecordStatus.PAID },
        _sum: { netAmount: true, grossAmount: true, tdsAmount: true, adminFee: true },
        _count: { id: true },
      }),
      this.prisma.distributionRecord.aggregate({
        where: { ...distributionWhere, status: DistributionRecordStatus.PENDING },
        _sum: { netAmount: true, grossAmount: true },
        _count: { id: true },
      }),
    ]);

    // Membership earnings totals
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
        membershipBreakdown[g.status as keyof typeof membershipBreakdown] = sum;
      }
    });

    // Repurchase earnings totals
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
        repurchaseBreakdown[g.status as keyof typeof repurchaseBreakdown] = sum;
      }
    });

    const totalEarnings = totalMembershipEarnings + totalRepurchaseEarnings;

    // Total distributed payouts (paid distribution records)
    const totalDistributed = Number(disbursedRecordSum._sum.netAmount ?? 0);
    const totalGrossDistributed = Number(disbursedRecordSum._sum.grossAmount ?? 0);
    const totalTdsDeducted = Number(disbursedRecordSum._sum.tdsAmount ?? 0);
    const totalAdminFeeDeducted = Number(disbursedRecordSum._sum.adminFee ?? 0);

    // Pending distributions (pending ledgers + pending distribution records)
    const pendingLedgersAmount = membershipBreakdown.PENDING + repurchaseBreakdown.PENDING;
    const pendingRecordsAmount = Number(pendingRecordSum._sum.netAmount ?? 0);
    const pendingDistributions = pendingLedgersAmount + pendingRecordsAmount;

    const result: IEarningsStatsResponse = {
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

  /**
   * 3. GET /admin/dashboard/business
   * Combined view aggregating repurchase summary, growth summary, and earnings summary.
   */
  async getBusinessStats(query: QueryDashboardDto): Promise<IBusinessStatsResponse> {
    const cacheKey = `admin:dashboard:business:${JSON.stringify(query)}`;

    if (!query.refresh) {
      const cached = await this.cacheService.get<IBusinessStatsResponse>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const { todayStart, weekStart, monthStart } = this.getDateBoundaries();
    const repurchaseWhere: Prisma.RepurchaseEntryWhereInput = { deletedAt: null };

    const dateFilter = this.buildDateWhere(query.startDate, query.endDate);
    if (dateFilter) {
      repurchaseWhere.transactionDate = dateFilter;
    }

    const [
      repurchaseCount,
      repurchaseVolumeAggregate,
      todayVolumeAggregate,
      weekVolumeAggregate,
      monthVolumeAggregate,
      memberStats,
      earningsStats,
    ] = await Promise.all([
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

    const result: IBusinessStatsResponse = {
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

  /**
   * 4. GET /admin/dashboard/activity
   * Unified activity feed pulling recent registrations, repurchases, distributions, and system activity logs.
   */
  async getActivityFeed(query: QueryActivityDto): Promise<IActivityFeedResponse> {
    const cacheKey = `admin:dashboard:activity:${JSON.stringify(query)}`;

    if (!query.refresh) {
      const cached = await this.cacheService.get<IActivityFeedResponse>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const { type = ActivityCategory.ALL, page = 1, limit = 10, startDate, endDate } = query;
    const items: IActivityFeedItem[] = [];

    const dateFilter = this.buildDateWhere(startDate, endDate);

    const fetchAll = type === ActivityCategory.ALL;
    const fetchRegistrations = fetchAll || type === ActivityCategory.MEMBER_REGISTRATION;
    const fetchRepurchases = fetchAll || type === ActivityCategory.REPURCHASE;
    const fetchDistributions = fetchAll || type === ActivityCategory.DISTRIBUTION;
    const fetchSystemActivities = fetchAll || type === ActivityCategory.SYSTEM_ACTIVITY;

    const promises: Promise<void>[] = [];

    // 1. Fetch recent member registrations
    if (fetchRegistrations) {
      promises.push(
        (async () => {
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
              category: ActivityCategory.MEMBER_REGISTRATION,
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
        })(),
      );
    }

    // 2. Fetch recent repurchase entries
    if (fetchRepurchases) {
      promises.push(
        (async () => {
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
              category: ActivityCategory.REPURCHASE,
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
        })(),
      );
    }

    // 3. Fetch recent distribution batches
    if (fetchDistributions) {
      promises.push(
        (async () => {
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
              category: ActivityCategory.DISTRIBUTION,
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
        })(),
      );
    }

    // 4. Fetch recent system activity logs
    if (fetchSystemActivities) {
      promises.push(
        (async () => {
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
              category: ActivityCategory.SYSTEM_ACTIVITY,
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
        })(),
      );
    }

    await Promise.all(promises);

    // Sort combined activities most-recent-first (descending timestamp)
    items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Paginate results
    const total = items.length;
    const skip = (page - 1) * limit;
    const paginatedItems = items.slice(skip, skip + limit);

    const result: IActivityFeedResponse = {
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

  /**
   * 5. GET /member/dashboard
   * Member Personal Dashboard derived strictly using authenticated memberId from JWT payload.
   */
  async getMemberPersonalDashboard(
    memberId: string,
    refresh?: boolean,
  ): Promise<IMemberPersonalDashboardResponse> {
    const cacheKey = `member:dashboard:${memberId}`;

    if (!refresh) {
      const cached = await this.cacheService.get<IMemberPersonalDashboardResponse>(cacheKey);
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
      throw new NotFoundException(`Member with ID '${memberId}' not found`);
    }

    // Parallel fetch for member personal metrics
    const [
      directReferralsCount,
      activeDirectReferralsCount,
      membershipGroups,
      repurchaseGroups,
      recentMembershipLedgers,
      recentRepurchaseLedgers,
    ] = await Promise.all([
      this.prisma.member.count({ where: { referrerId: memberId } }),
      this.prisma.member.count({ where: { referrerId: memberId, status: MemberStatus.ACTIVE } }),
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

    // Downline calculation via recursive CTE query
    let totalDownlineMembers = directReferralsCount;
    let activeDownlineMembers = activeDirectReferralsCount;

    try {
      if (typeof this.prisma.$queryRaw === 'function') {
        const downlineNodes = await this.prisma.$queryRaw<Array<{ id: string; status: string }>>`
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
        activeDownlineMembers = downlineNodes.filter((n) => n.status === MemberStatus.ACTIVE).length;
      }
    } catch (err: any) {
      this.logger.debug(`Downline CTE query skipped or error: ${err?.message}`);
    }

    // Process Membership Earnings
    let membershipEarnings = 0;
    const membershipBreakdown: Record<string, number> = {
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

    // Process Repurchase Earnings
    let repurchaseEarnings = 0;
    const repurchaseBreakdown: Record<string, number> = {
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

    // Merge recent commissions
    const recentCommissions: IMemberPersonalDashboardResponse['recentCommissions'] = [];

    recentMembershipLedgers.forEach((m: any) => {
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

    recentRepurchaseLedgers.forEach((r: any) => {
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

    const result: IMemberPersonalDashboardResponse = {
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
}
