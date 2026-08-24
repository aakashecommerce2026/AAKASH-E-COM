import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QueryAdminMembershipEarningsDto } from './dto/query-admin-membership-earnings.dto';
import { QueryAdminRepurchaseEarningsDto } from './dto/query-admin-repurchase-earnings.dto';
import { QueryEarningsAggregationDto } from './dto/query-earnings-aggregation.dto';
import { QueryMemberWiseEarningsDto } from './dto/query-member-wise-earnings.dto';
import { QueryMemberEarningsDto } from './dto/query-member-earnings.dto';
import { CommissionStatus, Prisma } from '@prisma/client';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper to build date range filters from optional ISO date strings.
   */
  private buildDateWhere(
    startDate?: string,
    endDate?: string,
  ): Prisma.DateTimeFilter | undefined {
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
   * 1. Admin membership earnings list with date range, member, level, status filters & summary totals.
   */
  async getAdminMembershipEarnings(query: QueryAdminMembershipEarningsDto) {
    const {
      startDate,
      endDate,
      memberId,
      beneficiaryMemberId,
      sourceMemberId,
      level,
      status,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;
    const where: Prisma.MembershipCommissionLedgerWhereInput = {};

    const createdAtFilter = this.buildDateWhere(startDate, endDate);
    if (createdAtFilter) {
      where.createdAt = createdAtFilter;
    }

    if (level) {
      where.level = level;
    }

    if (status) {
      where.status = status;
    }

    if (beneficiaryMemberId) {
      where.beneficiaryMemberId = beneficiaryMemberId;
    }

    if (sourceMemberId) {
      where.sourceMemberId = sourceMemberId;
    }

    if (memberId && !beneficiaryMemberId && !sourceMemberId) {
      where.OR = [
        { sourceMemberId: memberId },
        { beneficiaryMemberId: memberId },
      ];
    }

    const validSortFields = ['createdAt', 'amount', 'level', 'status'];
    const orderByField = validSortFields.includes(sortBy)
      ? sortBy
      : 'createdAt';

    const [total, ledgers, summaryGroups] = await Promise.all([
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
      this.prisma.membershipCommissionLedger.groupBy({
        by: ['status'],
        where,
        _sum: { amount: true },
        _count: { id: true },
      }),
    ]);

    let totalGrossAmount = 0;
    let pendingAmount = 0;
    let holdAmount = 0;
    let disbursedAmount = 0;
    let cancelledAmount = 0;

    summaryGroups.forEach((g) => {
      const sum = Number(g._sum.amount ?? 0);
      totalGrossAmount += sum;

      if (g.status === CommissionStatus.PENDING) pendingAmount += sum;
      if (g.status === CommissionStatus.HOLD) holdAmount += sum;
      if (g.status === CommissionStatus.DISBURSED) disbursedAmount += sum;
      if (g.status === CommissionStatus.CANCELLED) cancelledAmount += sum;
    });

    const data = ledgers.map((l) => ({
      id: l.id,
      sourceMemberId: l.sourceMemberId,
      sourceMember: l.sourceMember,
      beneficiaryMemberId: l.beneficiaryMemberId,
      beneficiaryMember: l.beneficiaryMember,
      level: l.level,
      percentage: Number(l.percentage),
      amount: Number(l.amount),
      status: l.status,
      distributionRecordId: l.distributionRecordId,
      createdAt: l.createdAt,
      updatedAt: l.updatedAt,
    }));

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      summary: {
        totalGrossAmount,
        pendingAmount,
        holdAmount,
        disbursedAmount,
        cancelledAmount,
      },
    };
  }

  /**
   * 2a. GET /admin/earnings/membership/level-wise aggregation (levels 1..20)
   */
  async getLevelWiseEarnings(query: QueryEarningsAggregationDto) {
    const { startDate, endDate, status } = query;
    const where: Prisma.MembershipCommissionLedgerWhereInput = {};

    const createdAtFilter = this.buildDateWhere(startDate, endDate);
    if (createdAtFilter) {
      where.createdAt = createdAtFilter;
    }
    if (status) {
      where.status = status;
    }

    const [totalsByLevel, statusBreakdown] = await Promise.all([
      this.prisma.membershipCommissionLedger.groupBy({
        by: ['level'],
        where,
        _sum: { amount: true },
        _count: { id: true },
      }),
      this.prisma.membershipCommissionLedger.groupBy({
        by: ['level', 'status'],
        where,
        _sum: { amount: true },
      }),
    ]);

    const totalsMap = new Map<number, { sum: number; count: number }>();
    totalsByLevel.forEach((g) => {
      totalsMap.set(g.level, {
        sum: Number(g._sum.amount ?? 0),
        count: g._count.id,
      });
    });

    const statusMap = new Map<string, number>();
    statusBreakdown.forEach((g) => {
      const key = `${g.level}_${g.status}`;
      statusMap.set(key, Number(g._sum.amount ?? 0));
    });

    const result = Array.from({ length: 20 }, (_, i) => {
      const lvl = i + 1;
      const t = totalsMap.get(lvl) || { sum: 0, count: 0 };

      return {
        level: lvl,
        totalAmount: t.sum,
        totalCount: t.count,
        pendingAmount: statusMap.get(`${lvl}_${CommissionStatus.PENDING}`) || 0,
        holdAmount: statusMap.get(`${lvl}_${CommissionStatus.HOLD}`) || 0,
        disbursedAmount:
          statusMap.get(`${lvl}_${CommissionStatus.DISBURSED}`) || 0,
        cancelledAmount:
          statusMap.get(`${lvl}_${CommissionStatus.CANCELLED}`) || 0,
      };
    });

    return result;
  }

  /**
   * 2b. GET /admin/earnings/membership/member-wise aggregation
   */
  async getMemberWiseEarnings(query: QueryMemberWiseEarningsDto) {
    const { startDate, endDate, status, search, page = 1, limit = 10 } = query;
    const where: Prisma.MembershipCommissionLedgerWhereInput = {};

    const createdAtFilter = this.buildDateWhere(startDate, endDate);
    if (createdAtFilter) {
      where.createdAt = createdAtFilter;
    }
    if (status) {
      where.status = status;
    }

    if (search && search.trim() !== '') {
      const term = search.trim();
      where.beneficiaryMember = {
        OR: [
          { name: { contains: term, mode: 'insensitive' } },
          { memberCode: { contains: term, mode: 'insensitive' } },
          { mobile: { contains: term } },
          { email: { contains: term, mode: 'insensitive' } },
        ],
      };
    }

    const groupedBeneficiaries =
      await this.prisma.membershipCommissionLedger.groupBy({
        by: ['beneficiaryMemberId'],
        where,
        _sum: { amount: true },
        _count: { id: true },
      });

    const totalMembers = groupedBeneficiaries.length;
    const skip = (page - 1) * limit;

    // Sort by highest total earnings descending
    groupedBeneficiaries.sort(
      (a, b) => Number(b._sum.amount ?? 0) - Number(a._sum.amount ?? 0),
    );

    const paginatedGroup = groupedBeneficiaries.slice(skip, skip + limit);
    const targetMemberIds = paginatedGroup.map((g) => g.beneficiaryMemberId);

    if (targetMemberIds.length === 0) {
      return {
        data: [],
        meta: {
          total: 0,
          page,
          limit,
          totalPages: 0,
        },
      };
    }

    const [members, memberStatusBreakdowns] = await Promise.all([
      this.prisma.member.findMany({
        where: { id: { in: targetMemberIds } },
        select: {
          id: true,
          memberCode: true,
          name: true,
          mobile: true,
          email: true,
          status: true,
        },
      }),
      this.prisma.membershipCommissionLedger.groupBy({
        by: ['beneficiaryMemberId', 'status'],
        where: {
          ...where,
          beneficiaryMemberId: { in: targetMemberIds },
        },
        _sum: { amount: true },
      }),
    ]);

    const memberMap = new Map<string, any>();
    members.forEach((m) => memberMap.set(m.id, m));

    const statusMap = new Map<string, number>();
    memberStatusBreakdowns.forEach((g) => {
      const key = `${g.beneficiaryMemberId}_${g.status}`;
      statusMap.set(key, Number(g._sum.amount ?? 0));
    });

    const data = paginatedGroup.map((g) => {
      const mId = g.beneficiaryMemberId;
      const memberInfo = memberMap.get(mId);

      return {
        member: memberInfo || {
          id: mId,
          memberCode: 'UNKNOWN',
          name: 'Unknown',
        },
        totalEarned: Number(g._sum.amount ?? 0),
        totalLedgers: g._count.id,
        pendingAmount: statusMap.get(`${mId}_${CommissionStatus.PENDING}`) || 0,
        holdAmount: statusMap.get(`${mId}_${CommissionStatus.HOLD}`) || 0,
        disbursedAmount:
          statusMap.get(`${mId}_${CommissionStatus.DISBURSED}`) || 0,
        cancelledAmount:
          statusMap.get(`${mId}_${CommissionStatus.CANCELLED}`) || 0,
      };
    });

    return {
      data,
      meta: {
        total: totalMembers,
        page,
        limit,
        totalPages: Math.ceil(totalMembers / limit),
      },
    };
  }

  /**
   * 3. GET /member/earnings/membership — Member self-service earnings scoped to logged-in user JWT ID
   */
  async getMemberEarnings(
    loggedInUserId: string,
    query: QueryMemberEarningsDto,
  ) {
    const member = await this.prisma.member.findUnique({
      where: { id: loggedInUserId },
    });

    if (!member) {
      throw new NotFoundException(
        `Member account not found for ID '${loggedInUserId}'`,
      );
    }

    const { startDate, endDate, level, status, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.MembershipCommissionLedgerWhereInput = {
      beneficiaryMemberId: loggedInUserId,
    };

    const createdAtFilter = this.buildDateWhere(startDate, endDate);
    if (createdAtFilter) {
      where.createdAt = createdAtFilter;
    }
    if (level) {
      where.level = level;
    }
    if (status) {
      where.status = status;
    }

    const [total, ledgers, summaryGroups] = await Promise.all([
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
        where: { beneficiaryMemberId: loggedInUserId }, // Overall stats for this member
        _sum: { amount: true },
        _count: { id: true },
      }),
    ]);

    let totalEarned = 0;
    let pendingAmount = 0;
    let holdAmount = 0;
    let disbursedAmount = 0;
    let cancelledAmount = 0;

    summaryGroups.forEach((g) => {
      const sum = Number(g._sum.amount ?? 0);
      totalEarned += sum;

      if (g.status === CommissionStatus.PENDING) pendingAmount += sum;
      if (g.status === CommissionStatus.HOLD) holdAmount += sum;
      if (g.status === CommissionStatus.DISBURSED) disbursedAmount += sum;
      if (g.status === CommissionStatus.CANCELLED) cancelledAmount += sum;
    });

    const data = ledgers.map((l) => ({
      id: l.id,
      sourceMemberId: l.sourceMemberId,
      sourceMember: l.sourceMember,
      beneficiaryMemberId: l.beneficiaryMemberId,
      level: l.level,
      percentage: Number(l.percentage),
      amount: Number(l.amount),
      status: l.status,
      createdAt: l.createdAt,
      updatedAt: l.updatedAt,
    }));

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      summary: {
        totalEarned,
        pendingAmount,
        holdAmount,
        disbursedAmount,
        cancelledAmount,
      },
    };
  }

  // ==========================================
  // REPURCHASE EARNINGS REPORTING METHODS
  // ==========================================

  /**
   * 4. Admin repurchase earnings list with date range, member, level, status filters & summary totals.
   */
  async getAdminRepurchaseEarnings(query: QueryAdminRepurchaseEarningsDto) {
    const {
      startDate,
      endDate,
      memberId,
      beneficiaryMemberId,
      sourceMemberId,
      level,
      status,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;
    const where: Prisma.RepurchaseCommissionLedgerWhereInput = {};

    const createdAtFilter = this.buildDateWhere(startDate, endDate);
    if (createdAtFilter) {
      where.createdAt = createdAtFilter;
    }

    if (level) {
      where.level = level;
    }

    if (status) {
      where.status = status;
    }

    if (beneficiaryMemberId) {
      where.beneficiaryMemberId = beneficiaryMemberId;
    }

    if (sourceMemberId) {
      where.sourceMemberId = sourceMemberId;
    }

    if (memberId && !beneficiaryMemberId && !sourceMemberId) {
      where.OR = [
        { sourceMemberId: memberId },
        { beneficiaryMemberId: memberId },
      ];
    }

    const validSortFields = ['createdAt', 'amount', 'level', 'status'];
    const orderByField = validSortFields.includes(sortBy)
      ? sortBy
      : 'createdAt';

    const [total, ledgers, summaryGroups] = await Promise.all([
      this.prisma.repurchaseCommissionLedger.count({ where }),
      this.prisma.repurchaseCommissionLedger.findMany({
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
          repurchaseEntry: {
            select: {
              id: true,
              transactionRef: true,
              amount: true,
              transactionDate: true,
            },
          },
        },
      }),
      this.prisma.repurchaseCommissionLedger.groupBy({
        by: ['status'],
        where,
        _sum: { amount: true },
        _count: { id: true },
      }),
    ]);

    let totalGrossAmount = 0;
    let pendingAmount = 0;
    let holdAmount = 0;
    let disbursedAmount = 0;
    let cancelledAmount = 0;

    summaryGroups.forEach((g) => {
      const sum = Number(g._sum.amount ?? 0);
      totalGrossAmount += sum;

      if (g.status === CommissionStatus.PENDING) pendingAmount += sum;
      if (g.status === CommissionStatus.HOLD) holdAmount += sum;
      if (g.status === CommissionStatus.DISBURSED) disbursedAmount += sum;
      if (g.status === CommissionStatus.CANCELLED) cancelledAmount += sum;
    });

    const data = ledgers.map((l) => ({
      id: l.id,
      repurchaseEntryId: l.repurchaseEntryId,
      repurchaseEntry: l.repurchaseEntry
        ? {
            ...l.repurchaseEntry,
            amount: Number(l.repurchaseEntry.amount),
          }
        : undefined,
      sourceMemberId: l.sourceMemberId,
      sourceMember: l.sourceMember,
      beneficiaryMemberId: l.beneficiaryMemberId,
      beneficiaryMember: l.beneficiaryMember,
      level: l.level,
      percentage: Number(l.percentage),
      amount: Number(l.amount),
      status: l.status,
      distributionRecordId: l.distributionRecordId,
      createdAt: l.createdAt,
      updatedAt: l.updatedAt,
    }));

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      summary: {
        totalGrossAmount,
        pendingAmount,
        holdAmount,
        disbursedAmount,
        cancelledAmount,
      },
    };
  }

  /**
   * 5. GET /admin/earnings/repurchase/level-wise aggregation (levels 1..20)
   */
  async getLevelWiseRepurchaseEarnings(query: QueryEarningsAggregationDto) {
    const { startDate, endDate, status } = query;
    const where: Prisma.RepurchaseCommissionLedgerWhereInput = {};

    const createdAtFilter = this.buildDateWhere(startDate, endDate);
    if (createdAtFilter) {
      where.createdAt = createdAtFilter;
    }
    if (status) {
      where.status = status;
    }

    const [totalsByLevel, statusBreakdown] = await Promise.all([
      this.prisma.repurchaseCommissionLedger.groupBy({
        by: ['level'],
        where,
        _sum: { amount: true },
        _count: { id: true },
      }),
      this.prisma.repurchaseCommissionLedger.groupBy({
        by: ['level', 'status'],
        where,
        _sum: { amount: true },
      }),
    ]);

    const totalsMap = new Map<number, { sum: number; count: number }>();
    totalsByLevel.forEach((g) => {
      totalsMap.set(g.level, {
        sum: Number(g._sum.amount ?? 0),
        count: g._count.id,
      });
    });

    const statusMap = new Map<string, number>();
    statusBreakdown.forEach((g) => {
      const key = `${g.level}_${g.status}`;
      statusMap.set(key, Number(g._sum.amount ?? 0));
    });

    const result = Array.from({ length: 20 }, (_, i) => {
      const lvl = i + 1;
      const t = totalsMap.get(lvl) || { sum: 0, count: 0 };

      return {
        level: lvl,
        totalAmount: t.sum,
        totalCount: t.count,
        pendingAmount: statusMap.get(`${lvl}_${CommissionStatus.PENDING}`) || 0,
        holdAmount: statusMap.get(`${lvl}_${CommissionStatus.HOLD}`) || 0,
        disbursedAmount:
          statusMap.get(`${lvl}_${CommissionStatus.DISBURSED}`) || 0,
        cancelledAmount:
          statusMap.get(`${lvl}_${CommissionStatus.CANCELLED}`) || 0,
      };
    });

    return result;
  }

  /**
   * 6. GET /admin/earnings/repurchase/member-wise aggregation
   */
  async getMemberWiseRepurchaseEarnings(query: QueryMemberWiseEarningsDto) {
    const { startDate, endDate, status, search, page = 1, limit = 10 } = query;
    const where: Prisma.RepurchaseCommissionLedgerWhereInput = {};

    const createdAtFilter = this.buildDateWhere(startDate, endDate);
    if (createdAtFilter) {
      where.createdAt = createdAtFilter;
    }
    if (status) {
      where.status = status;
    }

    if (search && search.trim() !== '') {
      const term = search.trim();
      where.beneficiaryMember = {
        OR: [
          { name: { contains: term, mode: 'insensitive' } },
          { memberCode: { contains: term, mode: 'insensitive' } },
          { mobile: { contains: term } },
          { email: { contains: term, mode: 'insensitive' } },
        ],
      };
    }

    const groupedBeneficiaries =
      await this.prisma.repurchaseCommissionLedger.groupBy({
        by: ['beneficiaryMemberId'],
        where,
        _sum: { amount: true },
        _count: { id: true },
      });

    const totalMembers = groupedBeneficiaries.length;
    const skip = (page - 1) * limit;

    // Sort by highest total earnings descending
    groupedBeneficiaries.sort(
      (a, b) => Number(b._sum.amount ?? 0) - Number(a._sum.amount ?? 0),
    );

    const paginatedGroup = groupedBeneficiaries.slice(skip, skip + limit);
    const targetMemberIds = paginatedGroup.map((g) => g.beneficiaryMemberId);

    if (targetMemberIds.length === 0) {
      return {
        data: [],
        meta: {
          total: 0,
          page,
          limit,
          totalPages: 0,
        },
      };
    }

    const [members, memberStatusBreakdowns] = await Promise.all([
      this.prisma.member.findMany({
        where: { id: { in: targetMemberIds } },
        select: {
          id: true,
          memberCode: true,
          name: true,
          mobile: true,
          email: true,
          status: true,
        },
      }),
      this.prisma.repurchaseCommissionLedger.groupBy({
        by: ['beneficiaryMemberId', 'status'],
        where: {
          ...where,
          beneficiaryMemberId: { in: targetMemberIds },
        },
        _sum: { amount: true },
      }),
    ]);

    const memberMap = new Map<string, any>();
    members.forEach((m) => memberMap.set(m.id, m));

    const statusMap = new Map<string, number>();
    memberStatusBreakdowns.forEach((g) => {
      const key = `${g.beneficiaryMemberId}_${g.status}`;
      statusMap.set(key, Number(g._sum.amount ?? 0));
    });

    const data = paginatedGroup.map((g) => {
      const mId = g.beneficiaryMemberId;
      const memberInfo = memberMap.get(mId);

      return {
        member: memberInfo || {
          id: mId,
          memberCode: 'UNKNOWN',
          name: 'Unknown',
        },
        totalEarned: Number(g._sum.amount ?? 0),
        totalLedgers: g._count.id,
        pendingAmount: statusMap.get(`${mId}_${CommissionStatus.PENDING}`) || 0,
        holdAmount: statusMap.get(`${mId}_${CommissionStatus.HOLD}`) || 0,
        disbursedAmount:
          statusMap.get(`${mId}_${CommissionStatus.DISBURSED}`) || 0,
        cancelledAmount:
          statusMap.get(`${mId}_${CommissionStatus.CANCELLED}`) || 0,
      };
    });

    return {
      data,
      meta: {
        total: totalMembers,
        page,
        limit,
        totalPages: Math.ceil(totalMembers / limit),
      },
    };
  }

  /**
   * 7. GET /member/earnings/repurchase — Member self-service repurchase earnings scoped to logged-in user JWT ID
   */
  async getMemberRepurchaseEarnings(
    loggedInUserId: string,
    query: QueryMemberEarningsDto,
  ) {
    const member = await this.prisma.member.findUnique({
      where: { id: loggedInUserId },
    });

    if (!member) {
      throw new NotFoundException(
        `Member account not found for ID '${loggedInUserId}'`,
      );
    }

    const { startDate, endDate, level, status, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.RepurchaseCommissionLedgerWhereInput = {
      beneficiaryMemberId: loggedInUserId,
    };

    const createdAtFilter = this.buildDateWhere(startDate, endDate);
    if (createdAtFilter) {
      where.createdAt = createdAtFilter;
    }
    if (level) {
      where.level = level;
    }
    if (status) {
      where.status = status;
    }

    const [total, ledgers, summaryGroups] = await Promise.all([
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
            select: {
              id: true,
              transactionRef: true,
              amount: true,
              transactionDate: true,
            },
          },
        },
      }),
      this.prisma.repurchaseCommissionLedger.groupBy({
        by: ['status'],
        where: { beneficiaryMemberId: loggedInUserId }, // Overall stats for this member
        _sum: { amount: true },
        _count: { id: true },
      }),
    ]);

    let totalEarned = 0;
    let pendingAmount = 0;
    let holdAmount = 0;
    let disbursedAmount = 0;
    let cancelledAmount = 0;

    summaryGroups.forEach((g) => {
      const sum = Number(g._sum.amount ?? 0);
      totalEarned += sum;

      if (g.status === CommissionStatus.PENDING) pendingAmount += sum;
      if (g.status === CommissionStatus.HOLD) holdAmount += sum;
      if (g.status === CommissionStatus.DISBURSED) disbursedAmount += sum;
      if (g.status === CommissionStatus.CANCELLED) cancelledAmount += sum;
    });

    const data = ledgers.map((l) => ({
      id: l.id,
      repurchaseEntryId: l.repurchaseEntryId,
      repurchaseEntry: l.repurchaseEntry
        ? {
            ...l.repurchaseEntry,
            amount: Number(l.repurchaseEntry.amount),
          }
        : undefined,
      sourceMemberId: l.sourceMemberId,
      sourceMember: l.sourceMember,
      beneficiaryMemberId: l.beneficiaryMemberId,
      level: l.level,
      percentage: Number(l.percentage),
      amount: Number(l.amount),
      status: l.status,
      createdAt: l.createdAt,
      updatedAt: l.updatedAt,
    }));

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      summary: {
        totalEarned,
        pendingAmount,
        holdAmount,
        disbursedAmount,
        cancelledAmount,
      },
    };
  }
}
