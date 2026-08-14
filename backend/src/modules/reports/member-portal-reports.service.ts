import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QueryMemberEarningsBreakdownDto, EarningsTimeRange } from './dto/query-member-earnings-breakdown.dto';
import { QueryMemberActivityDto, MemberActivityCategory } from './dto/query-member-activity.dto';
import { CommissionStatus, DistributionRecordStatus, Prisma } from '@prisma/client';

export interface IEarningsTimeSeriesPoint {
  date: string;
  amount: number;
  count: number;
}

export interface IMemberTotalEarningsSummaryResponse {
  memberId: string;
  totalMembershipEarnings: number;
  totalRepurchaseEarnings: number;
  totalEarnings: number;
  totalDistributed: number;
  totalGrossDistributed: number;
  totalTdsDeducted: number;
  totalAdminFeeDeducted: number;
  totalPending: number;
  membershipBreakdown: Record<string, number>;
  repurchaseBreakdown: Record<string, number>;
  distributionSummary: {
    totalPaidRecordsCount: number;
    totalPendingRecordsCount: number;
    pendingLedgersAmount: number;
    pendingRecordsAmount: number;
  };
  calculatedAt: string;
}

export interface IMemberActivityItem {
  id: string;
  category: string;
  action: string;
  timestamp: string;
  details: Record<string, any>;
}

@Injectable()
export class MemberPortalReportsService {
  constructor(private readonly prisma: PrismaService) {}

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
   * 1. GET /member/earnings/membership?range=daily|weekly|monthly
   * Grouped aggregation queries on membership_commission_ledger scoped strictly to beneficiary_member_id = self.
   */
  async getMembershipEarningsBreakdown(
    memberId: string,
    query: QueryMemberEarningsBreakdownDto,
  ) {
    const member = await this.prisma.member.findUnique({ where: { id: memberId } });
    if (!member) {
      throw new NotFoundException(`Member with ID '${memberId}' not found`);
    }

    const { range = EarningsTimeRange.DAILY, startDate, endDate, status, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.MembershipCommissionLedgerWhereInput = {
      beneficiaryMemberId: memberId,
    };

    const createdAtFilter = this.buildDateWhere(startDate, endDate);
    if (createdAtFilter) {
      where.createdAt = createdAtFilter;
    }
    if (status) {
      where.status = status;
    }

    const [total, ledgers, statusGroups, levelGroups] = await Promise.all([
      this.prisma.membershipCommissionLedger.count({ where }),
      this.prisma.membershipCommissionLedger.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          sourceMember: {
            select: { id: true, memberCode: true, name: true, mobile: true },
          },
        },
      }),
      this.prisma.membershipCommissionLedger.groupBy({
        by: ['status'],
        where: { beneficiaryMemberId: memberId },
        _sum: { amount: true },
        _count: { id: true },
      }),
      this.prisma.membershipCommissionLedger.groupBy({
        by: ['level'],
        where: { beneficiaryMemberId: memberId },
        _sum: { amount: true },
        _count: { id: true },
      }),
    ]);

    // Status breakdown map
    const statusBreakdown: Record<string, number> = {
      DISBURSED: 0,
      PENDING: 0,
      HOLD: 0,
      CANCELLED: 0,
    };
    let totalEarned = 0;

    statusGroups.forEach((g) => {
      const sum = Number(g._sum.amount ?? 0);
      totalEarned += sum;
      statusBreakdown[g.status] = sum;
    });

    // Level breakdown map (level 1 to 20)
    const levelBreakdown: Record<string, number> = {};
    for (let i = 1; i <= 20; i++) {
      levelBreakdown[`level_${i}`] = 0;
    }
    levelGroups.forEach((g) => {
      levelBreakdown[`level_${g.level}`] = Number(g._sum.amount ?? 0);
    });

    // Time series trend via PostgreSQL DATE_TRUNC query
    let timeSeries: IEarningsTimeSeriesPoint[] = [];
    const truncUnit = range === EarningsTimeRange.MONTHLY ? 'month' : range === EarningsTimeRange.WEEKLY ? 'week' : 'day';

    try {
      if (typeof this.prisma.$queryRaw === 'function') {
        const rawTrend: Array<{ date: Date | string; count: bigint | number; amount: number }> =
          await this.prisma.$queryRaw`
            SELECT 
              DATE_TRUNC(${truncUnit}, created_at) AS date,
              COUNT(id)::int AS count,
              COALESCE(SUM(amount), 0)::float AS amount
            FROM membership_commission_ledger
            WHERE beneficiary_member_id = ${memberId}
            GROUP BY 1
            ORDER BY 1 ASC
            LIMIT 30;
          `;

        timeSeries = rawTrend.map((r) => ({
          date: r.date instanceof Date ? r.date.toISOString().split('T')[0] : String(r.date).split('T')[0],
          amount: Number(r.amount),
          count: Number(r.count),
        }));
      }
    } catch {
      timeSeries = [];
    }

    const data = ledgers.map((l) => ({
      id: l.id,
      sourceMemberId: l.sourceMemberId,
      sourceMember: l.sourceMember,
      beneficiaryMemberId: l.beneficiaryMemberId,
      level: l.level,
      percentage: Number(l.percentage),
      amount: Number(l.amount),
      status: l.status,
      createdAt: l.createdAt.toISOString(),
    }));

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
      summary: {
        totalEarned,
        statusBreakdown,
        levelBreakdown,
      },
      timeSeries,
      calculatedAt: new Date().toISOString(),
    };
  }

  /**
   * 2. GET /member/earnings/repurchase?range=daily|weekly|monthly
   * Grouped aggregation queries on repurchase_commission_ledger scoped strictly to beneficiary_member_id = self.
   */
  async getRepurchaseEarningsBreakdown(
    memberId: string,
    query: QueryMemberEarningsBreakdownDto,
  ) {
    const member = await this.prisma.member.findUnique({ where: { id: memberId } });
    if (!member) {
      throw new NotFoundException(`Member with ID '${memberId}' not found`);
    }

    const { range = EarningsTimeRange.DAILY, startDate, endDate, status, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.RepurchaseCommissionLedgerWhereInput = {
      beneficiaryMemberId: memberId,
    };

    const createdAtFilter = this.buildDateWhere(startDate, endDate);
    if (createdAtFilter) {
      where.createdAt = createdAtFilter;
    }
    if (status) {
      where.status = status;
    }

    const [total, ledgers, statusGroups, levelGroups] = await Promise.all([
      this.prisma.repurchaseCommissionLedger.count({ where }),
      this.prisma.repurchaseCommissionLedger.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          sourceMember: {
            select: { id: true, memberCode: true, name: true, mobile: true },
          },
          repurchaseEntry: {
            select: { id: true, transactionRef: true, amount: true, transactionDate: true },
          },
        },
      }),
      this.prisma.repurchaseCommissionLedger.groupBy({
        by: ['status'],
        where: { beneficiaryMemberId: memberId },
        _sum: { amount: true },
        _count: { id: true },
      }),
      this.prisma.repurchaseCommissionLedger.groupBy({
        by: ['level'],
        where: { beneficiaryMemberId: memberId },
        _sum: { amount: true },
        _count: { id: true },
      }),
    ]);

    // Status breakdown map
    const statusBreakdown: Record<string, number> = {
      DISBURSED: 0,
      PENDING: 0,
      HOLD: 0,
      CANCELLED: 0,
    };
    let totalEarned = 0;

    statusGroups.forEach((g) => {
      const sum = Number(g._sum.amount ?? 0);
      totalEarned += sum;
      statusBreakdown[g.status] = sum;
    });

    // Level breakdown map (level 1 to 20)
    const levelBreakdown: Record<string, number> = {};
    for (let i = 1; i <= 20; i++) {
      levelBreakdown[`level_${i}`] = 0;
    }
    levelGroups.forEach((g) => {
      levelBreakdown[`level_${g.level}`] = Number(g._sum.amount ?? 0);
    });

    // Time series trend via PostgreSQL DATE_TRUNC query
    let timeSeries: IEarningsTimeSeriesPoint[] = [];
    const truncUnit = range === EarningsTimeRange.MONTHLY ? 'month' : range === EarningsTimeRange.WEEKLY ? 'week' : 'day';

    try {
      if (typeof this.prisma.$queryRaw === 'function') {
        const rawTrend: Array<{ date: Date | string; count: bigint | number; amount: number }> =
          await this.prisma.$queryRaw`
            SELECT 
              DATE_TRUNC(${truncUnit}, created_at) AS date,
              COUNT(id)::int AS count,
              COALESCE(SUM(amount), 0)::float AS amount
            FROM repurchase_commission_ledger
            WHERE beneficiary_member_id = ${memberId}
            GROUP BY 1
            ORDER BY 1 ASC
            LIMIT 30;
          `;

        timeSeries = rawTrend.map((r) => ({
          date: r.date instanceof Date ? r.date.toISOString().split('T')[0] : String(r.date).split('T')[0],
          amount: Number(r.amount),
          count: Number(r.count),
        }));
      }
    } catch {
      timeSeries = [];
    }

    const data = ledgers.map((l) => ({
      id: l.id,
      repurchaseEntryId: l.repurchaseEntryId,
      repurchaseEntry: l.repurchaseEntry
        ? {
            ...l.repurchaseEntry,
            amount: Number(l.repurchaseEntry.amount),
          }
        : null,
      sourceMemberId: l.sourceMemberId,
      sourceMember: l.sourceMember,
      beneficiaryMemberId: l.beneficiaryMemberId,
      level: l.level,
      percentage: Number(l.percentage),
      amount: Number(l.amount),
      status: l.status,
      createdAt: l.createdAt.toISOString(),
    }));

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
      summary: {
        totalEarned,
        statusBreakdown,
        levelBreakdown,
      },
      timeSeries,
      calculatedAt: new Date().toISOString(),
    };
  }

  /**
   * 3. GET /member/earnings/total
   * Combined total earnings summary for logged-in member.
   */
  async getTotalEarningsSummary(memberId: string): Promise<IMemberTotalEarningsSummaryResponse> {
    const member = await this.prisma.member.findUnique({ where: { id: memberId } });
    if (!member) {
      throw new NotFoundException(`Member with ID '${memberId}' not found`);
    }

    const [
      membershipGroups,
      repurchaseGroups,
      disbursedRecordSum,
      pendingRecordSum,
    ] = await Promise.all([
      this.prisma.membershipCommissionLedger.groupBy({
        by: ['status'],
        where: { beneficiaryMemberId: memberId },
        _sum: { amount: true },
        _count: { id: true },
      }),
      this.prisma.repurchaseCommissionLedger.groupBy({
        by: ['status'],
        where: { beneficiaryMemberId: memberId },
        _sum: { amount: true },
        _count: { id: true },
      }),
      this.prisma.distributionRecord.aggregate({
        where: { memberId, status: DistributionRecordStatus.PAID },
        _sum: { netAmount: true, grossAmount: true, tdsAmount: true, adminFee: true },
        _count: { id: true },
      }),
      this.prisma.distributionRecord.aggregate({
        where: { memberId, status: DistributionRecordStatus.PENDING },
        _sum: { netAmount: true, grossAmount: true },
        _count: { id: true },
      }),
    ]);

    let totalMembershipEarnings = 0;
    const membershipBreakdown: Record<string, number> = {
      DISBURSED: 0,
      PENDING: 0,
      HOLD: 0,
      CANCELLED: 0,
    };
    membershipGroups.forEach((g) => {
      const sum = Number(g._sum.amount ?? 0);
      totalMembershipEarnings += sum;
      membershipBreakdown[g.status] = sum;
    });

    let totalRepurchaseEarnings = 0;
    const repurchaseBreakdown: Record<string, number> = {
      DISBURSED: 0,
      PENDING: 0,
      HOLD: 0,
      CANCELLED: 0,
    };
    repurchaseGroups.forEach((g) => {
      const sum = Number(g._sum.amount ?? 0);
      totalRepurchaseEarnings += sum;
      repurchaseBreakdown[g.status] = sum;
    });

    const totalEarnings = totalMembershipEarnings + totalRepurchaseEarnings;
    const totalDistributed = Number(disbursedRecordSum._sum.netAmount ?? 0);
    const totalGrossDistributed = Number(disbursedRecordSum._sum.grossAmount ?? 0);
    const totalTdsDeducted = Number(disbursedRecordSum._sum.tdsAmount ?? 0);
    const totalAdminFeeDeducted = Number(disbursedRecordSum._sum.adminFee ?? 0);

    const pendingLedgersAmount = (membershipBreakdown.PENDING || 0) + (repurchaseBreakdown.PENDING || 0);
    const pendingRecordsAmount = Number(pendingRecordSum._sum.netAmount ?? 0);
    const totalPending = pendingLedgersAmount + pendingRecordsAmount;

    return {
      memberId,
      totalMembershipEarnings,
      totalRepurchaseEarnings,
      totalEarnings,
      totalDistributed,
      totalGrossDistributed,
      totalTdsDeducted,
      totalAdminFeeDeducted,
      totalPending,
      membershipBreakdown,
      repurchaseBreakdown,
      distributionSummary: {
        totalPaidRecordsCount: disbursedRecordSum._count.id,
        totalPendingRecordsCount: pendingRecordSum._count.id,
        pendingLedgersAmount,
        pendingRecordsAmount,
      },
      calculatedAt: new Date().toISOString(),
    };
  }

  /**
   * 4. GET /member/activity
   * Scoped activity history feed combining earnings, repurchase entries, payouts, and system logs.
   */
  async getActivityHistory(
    memberId: string,
    query: QueryMemberActivityDto,
  ) {
    const member = await this.prisma.member.findUnique({ where: { id: memberId } });
    if (!member) {
      throw new NotFoundException(`Member with ID '${memberId}' not found`);
    }

    const { category = MemberActivityCategory.ALL, page = 1, limit = 10, startDate, endDate } = query;
    const items: IMemberActivityItem[] = [];
    const dateFilter = this.buildDateWhere(startDate, endDate);

    const fetchAll = category === MemberActivityCategory.ALL;
    const fetchEarnings = fetchAll || category === MemberActivityCategory.EARNINGS;
    const fetchRepurchases = fetchAll || category === MemberActivityCategory.REPURCHASE;
    const fetchDistributions = fetchAll || category === MemberActivityCategory.DISTRIBUTION;
    const fetchSystem = fetchAll || category === MemberActivityCategory.SYSTEM;

    const promises: Promise<void>[] = [];

    // 1. Fetch Membership & Repurchase Earnings Ledgers
    if (fetchEarnings) {
      promises.push(
        (async () => {
          const membershipLedgers = await this.prisma.membershipCommissionLedger.findMany({
            where: {
              beneficiaryMemberId: memberId,
              ...(dateFilter ? { createdAt: dateFilter } : {}),
            },
            take: 50,
            orderBy: { createdAt: 'desc' },
            include: {
              sourceMember: { select: { id: true, memberCode: true, name: true } },
            },
          });

          membershipLedgers.forEach((m) => {
            items.push({
              id: `earn-mem-${m.id}`,
              category: 'EARNINGS',
              action: `Earned Level-${m.level} Membership Commission: ₹${Number(m.amount).toLocaleString('en-IN')}`,
              timestamp: m.createdAt.toISOString(),
              details: {
                ledgerId: m.id,
                type: 'MEMBERSHIP',
                amount: Number(m.amount),
                level: m.level,
                status: m.status,
                sourceMember: m.sourceMember,
              },
            });
          });

          const repurchaseLedgers = await this.prisma.repurchaseCommissionLedger.findMany({
            where: {
              beneficiaryMemberId: memberId,
              ...(dateFilter ? { createdAt: dateFilter } : {}),
            },
            take: 50,
            orderBy: { createdAt: 'desc' },
            include: {
              sourceMember: { select: { id: true, memberCode: true, name: true } },
            },
          });

          repurchaseLedgers.forEach((r) => {
            items.push({
              id: `earn-rep-${r.id}`,
              category: 'EARNINGS',
              action: `Earned Level-${r.level} Repurchase Commission: ₹${Number(r.amount).toLocaleString('en-IN')}`,
              timestamp: r.createdAt.toISOString(),
              details: {
                ledgerId: r.id,
                type: 'REPURCHASE',
                amount: Number(r.amount),
                level: r.level,
                status: r.status,
                sourceMember: r.sourceMember,
              },
            });
          });
        })(),
      );
    }

    // 2. Fetch Personal Repurchase Entries
    if (fetchRepurchases) {
      promises.push(
        (async () => {
          const repurchases = await this.prisma.repurchaseEntry.findMany({
            where: {
              memberId,
              deletedAt: null,
              ...(dateFilter ? { transactionDate: dateFilter } : {}),
            },
            take: 50,
            orderBy: { transactionDate: 'desc' },
          });

          repurchases.forEach((r) => {
            items.push({
              id: `rep-${r.id}`,
              category: 'REPURCHASE',
              action: `Recorded Repurchase Order (${r.transactionRef}): ₹${Number(r.amount).toLocaleString('en-IN')}`,
              timestamp: r.transactionDate.toISOString(),
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

      promises.push(
        (async () => {
          const logs = await this.prisma.activityLog.findMany({
            where: {
              OR: [{ actorId: memberId }, { entityId: memberId }],
              ...(dateFilter ? { createdAt: dateFilter } : {}),
            },
            take: 50,
            orderBy: { createdAt: 'desc' },
          });

          logs.forEach((l) => {
            items.push({
              id: `sys-log-${l.id}`,
              category: 'SYSTEM',
              action: `Account Event: ${l.actionType} on ${l.entityType}`,
              timestamp: l.createdAt.toISOString(),
              details: {
                logId: l.id,
                actionType: l.actionType,
                entityType: l.entityType,
                metadata: l.metadata,
              },
            });
          });
        })(),
      );
    }

    await Promise.all(promises);

    // Sort combined activities most-recent-first
    items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Paginate results
    const total = items.length;
    const skip = (page - 1) * limit;
    const paginatedItems = items.slice(skip, skip + limit);

    return {
      data: paginatedItems,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
      calculatedAt: new Date().toISOString(),
    };
  }
}
