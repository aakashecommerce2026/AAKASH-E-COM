import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QueryPeriodReportDto, ReportType } from './dto/query-period-report.dto';
import { CommissionStatus, MemberStatus, Prisma } from '@prisma/client';

export type PeriodType = 'daily' | 'weekly' | 'monthly';

@Injectable()
export class AdminReportsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Main router method for period reports
   */
  async getPeriodReport(period: PeriodType, query: QueryPeriodReportDto) {
    const { type } = query;
    switch (type) {
      case ReportType.MEMBER_REGISTRATIONS:
        return this.getMemberRegistrationsReport(period, query);
      case ReportType.REPURCHASE_ACTIVITIES:
        return this.getRepurchaseActivitiesReport(period, query);
      case ReportType.EARNINGS_SUMMARY:
        return this.getEarningsSummaryReport(period, query);
      case ReportType.BUSINESS_SUMMARY:
        return this.getBusinessSummaryReport(period, query);
      default:
        throw new BadRequestException(`Invalid report type: ${type}`);
    }
  }

  /**
   * Calculates default date range based on periodicity if not provided by user
   */
  private getDefaultDateRange(period: PeriodType, startDateStr?: string, endDateStr?: string) {
    const end = endDateStr ? new Date(endDateStr) : new Date();
    end.setHours(23, 59, 59, 999);

    let start: Date;
    if (startDateStr) {
      start = new Date(startDateStr);
      start.setHours(0, 0, 0, 0);
    } else {
      start = new Date(end);
      if (period === 'daily') {
        start.setDate(start.getDate() - 30);
      } else if (period === 'weekly') {
        start.setDate(start.getDate() - 84); // 12 weeks
      } else if (period === 'monthly') {
        start.setMonth(start.getMonth() - 12);
      }
      start.setHours(0, 0, 0, 0);
    }

    return { start, end };
  }

  /**
   * Helper to format a date into period key ('YYYY-MM-DD', 'YYYY-Www', or 'YYYY-MM')
   */
  private formatPeriodKey(date: Date, period: PeriodType): string {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');

    if (period === 'daily') {
      return `${yyyy}-${mm}-${dd}`;
    }

    if (period === 'monthly') {
      return `${yyyy}-${mm}`;
    }

    // Weekly key format
    const tempDate = new Date(date.valueOf());
    const dayNum = (date.getDay() + 6) % 7;
    tempDate.setDate(tempDate.getDate() - dayNum + 3);
    const firstThursday = tempDate.valueOf();
    tempDate.setMonth(0, 1);
    if (tempDate.getDay() !== 4) {
      tempDate.setMonth(0, 1 + ((4 - tempDate.getDay() + 7) % 7));
    }
    const weekNum = 1 + Math.round((firstThursday - tempDate.valueOf()) / 604800000);
    return `${yyyy}-W${String(weekNum).padStart(2, '0')}`;
  }

  /**
   * 1. Member Registrations Report (Daily, Weekly, Monthly)
   */
  private async getMemberRegistrationsReport(period: PeriodType, query: QueryPeriodReportDto) {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;
    const { start, end } = this.getDefaultDateRange(period, query.startDate, query.endDate);

    const where: Prisma.MemberWhereInput = {
      joiningDate: {
        gte: start,
        lte: end,
      },
    };

    const [totalRegistrations, statusGroups, members, rawMembersList] = await Promise.all([
      this.prisma.member.count({ where }),
      this.prisma.member.groupBy({
        by: ['status'],
        where,
        _count: { id: true },
      }),
      this.prisma.member.findMany({
        where,
        skip,
        take: limit,
        orderBy: { joiningDate: 'desc' },
        select: {
          id: true,
          memberCode: true,
          name: true,
          email: true,
          mobile: true,
          status: true,
          role: true,
          joiningDate: true,
          referrer: {
            select: { id: true, memberCode: true, name: true },
          },
        },
      }),
      this.prisma.member.findMany({
        where,
        select: { joiningDate: true, status: true },
        orderBy: { joiningDate: 'asc' },
      }),
    ]);

    const statusBreakdown: Record<string, number> = {
      ACTIVE: 0,
      PENDING: 0,
      INACTIVE: 0,
      BLOCKED: 0,
      SUSPENDED: 0,
    };
    statusGroups.forEach((g) => {
      statusBreakdown[g.status] = g._count.id;
    });

    const periodMap = new Map<string, { total: number; active: number; pending: number }>();
    rawMembersList.forEach((m) => {
      const key = this.formatPeriodKey(new Date(m.joiningDate), period);
      const curr = periodMap.get(key) || { total: 0, active: 0, pending: 0 };
      curr.total += 1;
      if (m.status === MemberStatus.ACTIVE) curr.active += 1;
      if (m.status === MemberStatus.PENDING) curr.pending += 1;
      periodMap.set(key, curr);
    });

    const trend = Array.from(periodMap.entries()).map(([periodKey, stats]) => ({
      period: periodKey,
      totalRegistrations: stats.total,
      activeCount: stats.active,
      pendingCount: stats.pending,
    }));

    return {
      periodType: period,
      dateRange: { startDate: start.toISOString(), endDate: end.toISOString() },
      summary: {
        totalRegistrations,
        statusBreakdown,
      },
      trend,
      data: members,
      meta: {
        total: totalRegistrations,
        page,
        limit,
        totalPages: Math.ceil(totalRegistrations / limit),
      },
      calculatedAt: new Date().toISOString(),
    };
  }

  /**
   * 2. Repurchase Activities Report (Daily, Weekly, Monthly)
   */
  private async getRepurchaseActivitiesReport(period: PeriodType, query: QueryPeriodReportDto) {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;
    const { start, end } = this.getDefaultDateRange(period, query.startDate, query.endDate);

    const where: Prisma.RepurchaseEntryWhereInput = {
      transactionDate: {
        gte: start,
        lte: end,
      },
      deletedAt: null,
    };

    const [totalOrders, aggregateResult, repurchaseList, rawRepurchases, commissionAgg] =
      await Promise.all([
        this.prisma.repurchaseEntry.count({ where }),
        this.prisma.repurchaseEntry.aggregate({
          where,
          _sum: { amount: true },
          _avg: { amount: true },
        }),
        this.prisma.repurchaseEntry.findMany({
          where,
          skip,
          take: limit,
          orderBy: { transactionDate: 'desc' },
          include: {
            member: {
              select: { id: true, memberCode: true, name: true, mobile: true },
            },
          },
        }),
        this.prisma.repurchaseEntry.findMany({
          where,
          select: { transactionDate: true, amount: true },
          orderBy: { transactionDate: 'asc' },
        }),
        this.prisma.repurchaseCommissionLedger.aggregate({
          where: {
            repurchaseEntry: {
              transactionDate: { gte: start, lte: end },
              deletedAt: null,
            },
          },
          _sum: { amount: true },
        }),
      ]);

    const totalVolume = Number(aggregateResult._sum.amount ?? 0);
    const averageOrderValue = Number(aggregateResult._avg.amount ?? 0);
    const totalCommissionGenerated = Number(commissionAgg._sum.amount ?? 0);

    const periodMap = new Map<string, { count: number; volume: number }>();
    rawRepurchases.forEach((r) => {
      const key = this.formatPeriodKey(new Date(r.transactionDate), period);
      const curr = periodMap.get(key) || { count: 0, volume: 0 };
      curr.count += 1;
      curr.volume += Number(r.amount);
      periodMap.set(key, curr);
    });

    const trend = Array.from(periodMap.entries()).map(([periodKey, stats]) => ({
      period: periodKey,
      orderCount: stats.count,
      totalVolume: stats.volume,
      averageOrderValue: stats.count > 0 ? stats.volume / stats.count : 0,
    }));

    const data = repurchaseList.map((item) => ({
      id: item.id,
      transactionRef: item.transactionRef,
      memberId: item.memberId,
      member: item.member,
      amount: Number(item.amount),
      transactionDate: item.transactionDate,
      remarks: item.remarks,
    }));

    return {
      periodType: period,
      dateRange: { startDate: start.toISOString(), endDate: end.toISOString() },
      summary: {
        totalOrders,
        totalVolume,
        averageOrderValue,
        totalCommissionGenerated,
      },
      trend,
      data,
      meta: {
        total: totalOrders,
        page,
        limit,
        totalPages: Math.ceil(totalOrders / limit),
      },
      calculatedAt: new Date().toISOString(),
    };
  }

  /**
   * 3. Earnings Summary Report (Daily, Weekly, Monthly)
   */
  private async getEarningsSummaryReport(period: PeriodType, query: QueryPeriodReportDto) {
    const { start, end } = this.getDefaultDateRange(period, query.startDate, query.endDate);

    const membershipWhere: Prisma.MembershipCommissionLedgerWhereInput = {
      createdAt: { gte: start, lte: end },
    };
    const repurchaseWhere: Prisma.RepurchaseCommissionLedgerWhereInput = {
      createdAt: { gte: start, lte: end },
    };
    const distributionWhere: Prisma.DistributionRecordWhereInput = {
      createdAt: { gte: start, lte: end },
    };

    const [
      membershipAgg,
      repurchaseAgg,
      distributionAgg,
      rawMembership,
      rawRepurchase,
    ] = await Promise.all([
      this.prisma.membershipCommissionLedger.aggregate({
        where: membershipWhere,
        _sum: { amount: true },
        _count: { id: true },
      }),
      this.prisma.repurchaseCommissionLedger.aggregate({
        where: repurchaseWhere,
        _sum: { amount: true },
        _count: { id: true },
      }),
      this.prisma.distributionRecord.aggregate({
        where: distributionWhere,
        _sum: { grossAmount: true, netAmount: true, tdsAmount: true, adminFee: true },
      }),
      this.prisma.membershipCommissionLedger.findMany({
        where: membershipWhere,
        select: { createdAt: true, amount: true },
      }),
      this.prisma.repurchaseCommissionLedger.findMany({
        where: repurchaseWhere,
        select: { createdAt: true, amount: true },
      }),
    ]);

    const totalMembershipEarnings = Number(membershipAgg._sum.amount ?? 0);
    const totalRepurchaseEarnings = Number(repurchaseAgg._sum.amount ?? 0);
    const totalEarnings = totalMembershipEarnings + totalRepurchaseEarnings;
    const totalGrossDistributed = Number(distributionAgg._sum.grossAmount ?? 0);
    const totalNetDistributed = Number(distributionAgg._sum.netAmount ?? 0);
    const totalTdsDeducted = Number(distributionAgg._sum.tdsAmount ?? 0);
    const totalAdminFeeDeducted = Number(distributionAgg._sum.adminFee ?? 0);

    const periodMap = new Map<string, { membership: number; repurchase: number }>();

    rawMembership.forEach((m) => {
      const key = this.formatPeriodKey(new Date(m.createdAt), period);
      const curr = periodMap.get(key) || { membership: 0, repurchase: 0 };
      curr.membership += Number(m.amount);
      periodMap.set(key, curr);
    });

    rawRepurchase.forEach((r) => {
      const key = this.formatPeriodKey(new Date(r.createdAt), period);
      const curr = periodMap.get(key) || { membership: 0, repurchase: 0 };
      curr.repurchase += Number(r.amount);
      periodMap.set(key, curr);
    });

    const trend = Array.from(periodMap.entries()).map(([periodKey, stats]) => ({
      period: periodKey,
      membershipEarnings: stats.membership,
      repurchaseEarnings: stats.repurchase,
      totalEarnings: stats.membership + stats.repurchase,
    }));

    return {
      periodType: period,
      dateRange: { startDate: start.toISOString(), endDate: end.toISOString() },
      summary: {
        totalMembershipEarnings,
        totalRepurchaseEarnings,
        totalEarnings,
        totalGrossDistributed,
        totalNetDistributed,
        totalTdsDeducted,
        totalAdminFeeDeducted,
      },
      trend,
      calculatedAt: new Date().toISOString(),
    };
  }

  /**
   * 4. Business Summary Report (Daily, Weekly, Monthly)
   */
  private async getBusinessSummaryReport(period: PeriodType, query: QueryPeriodReportDto) {
    const [regReport, repurchaseReport, earningsReport] = await Promise.all([
      this.getMemberRegistrationsReport(period, query),
      this.getRepurchaseActivitiesReport(period, query),
      this.getEarningsSummaryReport(period, query),
    ]);

    const totalRevenue = repurchaseReport.summary.totalVolume;
    const totalEarnings = earningsReport.summary.totalEarnings;
    const totalDistributed = earningsReport.summary.totalGrossDistributed;

    const payoutRatio =
      totalRevenue > 0
        ? Number(((totalEarnings / totalRevenue) * 100).toFixed(2))
        : 0;

    return {
      periodType: period,
      dateRange: regReport.dateRange,
      summary: {
        totalRegistrations: regReport.summary.totalRegistrations,
        activeRegistrations: regReport.summary.statusBreakdown.ACTIVE || 0,
        repurchaseOrders: repurchaseReport.summary.totalOrders,
        repurchaseVolume: repurchaseReport.summary.totalVolume,
        averageOrderValue: repurchaseReport.summary.averageOrderValue,
        totalEarningsGenerated: totalEarnings,
        totalDistributed,
        payoutRatioPercentage: payoutRatio,
      },
      registrationsTrend: regReport.trend,
      repurchaseTrend: repurchaseReport.trend,
      earningsTrend: earningsReport.trend,
      calculatedAt: new Date().toISOString(),
    };
  }
}
