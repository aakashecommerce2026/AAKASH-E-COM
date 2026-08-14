import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DashboardCacheService } from './dashboard-cache.service';
import { QueryDashboardDto } from './dto/query-dashboard.dto';
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
}
