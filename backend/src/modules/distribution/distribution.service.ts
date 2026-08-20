import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  Inject,
  Optional,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { QueryPendingDistributionDto } from './dto/query-pending-distribution.dto';
import { ProcessDistributionBatchDto } from './dto/process-distribution-batch.dto';
import { QueryDistributionHistoryDto } from './dto/query-distribution-history.dto';
import {
  CommissionStatus,
  DistributionBatchStatus,
  DistributionRecordStatus,
  MemberRole,
  PaymentMode,
  Prisma,
} from '@prisma/client';

@Injectable()
export class DistributionService {
  private readonly logger = new Logger(DistributionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
    @Optional() @InjectQueue('distribution-queue') private readonly distributionQueue?: Queue,
  ) {}

  /**
   * Helper to build date range filters from optional ISO date strings.
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
   * Helper to verify distribution data model wiring for pending ledgers.
   */
  async getPendingDistributionSummary() {
    const [
      pendingMembershipLedgers,
      pendingRepurchaseLedgers,
      membershipGrossSum,
      repurchaseGrossSum,
    ] = await Promise.all([
      this.prisma.membershipCommissionLedger.count({
        where: { status: CommissionStatus.PENDING, distributionRecordId: null },
      }),
      this.prisma.repurchaseCommissionLedger.count({
        where: { status: CommissionStatus.PENDING, distributionRecordId: null },
      }),
      this.prisma.membershipCommissionLedger.aggregate({
        where: { status: CommissionStatus.PENDING, distributionRecordId: null },
        _sum: { amount: true },
      }),
      this.prisma.repurchaseCommissionLedger.aggregate({
        where: { status: CommissionStatus.PENDING, distributionRecordId: null },
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

  /**
   * 1. GET /admin/distribution/pending — aggregated view of all PENDING membership + repurchase commissions
   */
  async getPendingCommissions(query: QueryPendingDistributionDto) {
    const { startDate, endDate, memberId, commissionType = 'ALL', page = 1, limit = 10 } = query;

    const dateFilter = this.buildDateWhere(startDate, endDate);

    const memWhere: Prisma.MembershipCommissionLedgerWhereInput = {
      status: CommissionStatus.PENDING,
      distributionRecordId: null,
      ...(dateFilter ? { createdAt: dateFilter } : {}),
      ...(memberId ? { beneficiaryMemberId: memberId } : {}),
    };

    const repWhere: Prisma.RepurchaseCommissionLedgerWhereInput = {
      status: CommissionStatus.PENDING,
      distributionRecordId: null,
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
                select: { id: true, memberCode: true, name: true, mobile: true, email: true, bankDetails: true, status: true },
              },
            },
          })
        : Promise.resolve([]),
      fetchRepurchase
        ? this.prisma.repurchaseCommissionLedger.findMany({
            where: repWhere,
            include: {
              beneficiaryMember: {
                select: { id: true, memberCode: true, name: true, mobile: true, email: true, bankDetails: true, status: true },
              },
            },
          })
        : Promise.resolve([]),
    ]);

    // Group pending ledgers by beneficiary member
    const memberMap = new Map<
      string,
      {
        member: any;
        membershipLedgers: any[];
        repurchaseLedgers: any[];
        membershipGrossAmount: number;
        repurchaseGrossAmount: number;
      }
    >();

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
      const entry = memberMap.get(bId)!;
      entry.membershipLedgers.push({ ...l, amount: Number(l.amount), percentage: Number(l.percentage) });
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
      const entry = memberMap.get(bId)!;
      entry.repurchaseLedgers.push({ ...l, amount: Number(l.amount), percentage: Number(l.percentage) });
      entry.repurchaseGrossAmount += Number(l.amount);
    }

    const allBeneficiaryEntries = Array.from(memberMap.values());
    const totalMembers = allBeneficiaryEntries.length;

    // Calculate per-member payouts with 5% TDS and 5% Admin Fee
    const formattedData = allBeneficiaryEntries.map((item) => {
      const grossAmount = Math.round((item.membershipGrossAmount + item.repurchaseGrossAmount) * 100) / 100;
      const tdsAmount = Math.round(grossAmount * 0.05 * 100) / 100; // 5% TDS
      const adminFee = Math.round(grossAmount * 0.05 * 100) / 100; // 5% Admin Fee
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

    // Overall summary across all pending ledgers
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

  /**
   * 2. POST /admin/distribution/process — Initiates background batch payout run
   * Creates a DistributionBatch in INITIATED state and dispatches Bull queue job (or executes inline fallback).
   */
  async processDistributionBatch(
    dto: ProcessDistributionBatchDto,
    actorId?: string,
    actorRole?: MemberRole,
  ) {
    const { remarks } = dto;

    // Generate unique batchNo e.g. BATCH-20260813-0001
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const batchCountToday = await (this.prisma as any).distributionBatch.count({
      where: {
        batchNo: { startsWith: `BATCH-${dateStr}` },
      },
    });
    const batchNo = `BATCH-${dateStr}-${(batchCountToday + 1).toString().padStart(4, '0')}`;

    // Create DistributionBatch in INITIATED state
    const batch = await (this.prisma as any).distributionBatch.create({
      data: {
        batchNo,
        totalMembers: 0,
        status: DistributionBatchStatus.INITIATED,
        processedBy: actorId || null,
        remarks: remarks || null,
        startedAt: new Date(),
      },
    });

    await this.auditService.logAction({
      actorId: actorId || null,
      actorRole: actorRole || MemberRole.ADMIN,
      actionType: 'CREATE_DISTRIBUTION_BATCH',
      entityType: 'DistributionBatch',
      entityId: batch.id,
      metadata: {
        batchNo: batch.batchNo,
        status: batch.status,
      },
    });

    // Enqueue job to Bull Queue if available, otherwise execute inline/fallback
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
          status: DistributionBatchStatus.INITIATED,
          message: `Distribution batch '${batch.batchNo}' initiated and enqueued for background processing.`,
          processedBy: batch.processedBy,
          createdAt: batch.createdAt,
        };
      } catch (err) {
        this.logger.warn(`Bull queue dispatch failed (${(err as Error).message}). Executing inline fallback.`);
      }
    }

    // Direct synchronous fallback for local/test execution without Redis
    return this.executeBatchProcessing(batch.id, dto, actorId, actorRole);
  }

  /**
   * Actual Distribution Batch Execution Processor (called by Bull Consumer or inline fallback).
   */
  async executeBatchProcessing(
    batchId: string,
    dto: ProcessDistributionBatchDto,
    actorId?: string,
    actorRole?: MemberRole,
  ) {
    const { cutoffDate, membershipLedgerIds, repurchaseLedgerIds, memberIds } = dto;
    const dateFilter = cutoffDate ? { lte: new Date(cutoffDate) } : undefined;

    return this.prisma.$transaction(async (tx: any) => {
      // 1. Mark batch status as PROCESSING
      await tx.distributionBatch.update({
        where: { id: batchId },
        data: { status: DistributionBatchStatus.PROCESSING },
      });

      // 2. Fetch matching pending membership commission ledgers
      const memWhere: Prisma.MembershipCommissionLedgerWhereInput = {
        status: CommissionStatus.PENDING,
        distributionRecordId: null,
        ...(dateFilter ? { createdAt: dateFilter } : {}),
        ...(membershipLedgerIds && membershipLedgerIds.length > 0 ? { id: { in: membershipLedgerIds } } : {}),
        ...(memberIds && memberIds.length > 0 ? { beneficiaryMemberId: { in: memberIds } } : {}),
      };

      // 3. Fetch matching pending repurchase commission ledgers
      const repWhere: Prisma.RepurchaseCommissionLedgerWhereInput = {
        status: CommissionStatus.PENDING,
        distributionRecordId: null,
        ...(dateFilter ? { createdAt: dateFilter } : {}),
        ...(repurchaseLedgerIds && repurchaseLedgerIds.length > 0 ? { id: { in: repurchaseLedgerIds } } : {}),
        ...(memberIds && memberIds.length > 0 ? { beneficiaryMemberId: { in: memberIds } } : {}),
      };

      const [memLedgers, repLedgers] = await Promise.all([
        tx.membershipCommissionLedger.findMany({ where: memWhere }),
        tx.repurchaseCommissionLedger.findMany({ where: repWhere }),
      ]);

      if (memLedgers.length === 0 && repLedgers.length === 0) {
        await tx.distributionBatch.update({
          where: { id: batchId },
          data: { status: DistributionBatchStatus.FAILED, remarks: 'No pending ledgers matched criteria' },
        });
        throw new BadRequestException('No pending commission ledgers match the selected distribution criteria.');
      }

      // 4. Group selected ledgers by beneficiary member
      const memberGroupMap = new Map<
        string,
        {
          membershipLedgers: any[];
          repurchaseLedgers: any[];
          grossAmount: number;
        }
      >();

      for (const l of memLedgers) {
        const bId = l.beneficiaryMemberId;
        if (!memberGroupMap.has(bId)) {
          memberGroupMap.set(bId, { membershipLedgers: [], repurchaseLedgers: [], grossAmount: 0 });
        }
        const g = memberGroupMap.get(bId)!;
        g.membershipLedgers.push(l);
        g.grossAmount += Number(l.amount);
      }

      for (const l of repLedgers) {
        const bId = l.beneficiaryMemberId;
        if (!memberGroupMap.has(bId)) {
          memberGroupMap.set(bId, { membershipLedgers: [], repurchaseLedgers: [], grossAmount: 0 });
        }
        const g = memberGroupMap.get(bId)!;
        g.repurchaseLedgers.push(l);
        g.grossAmount += Number(l.amount);
      }

      // 5. Process per-member DistributionRecords and link ledgers
      let batchTotalGross = 0;
      let batchTotalTds = 0;
      let batchTotalAdminFee = 0;
      let batchTotalNet = 0;
      const notificationParamsList: any[] = [];

      for (const [bId, group] of memberGroupMap.entries()) {
        const grossAmount = Math.round(group.grossAmount * 100) / 100;
        const tdsAmount = Math.round(grossAmount * 0.05 * 100) / 100; // 5% TDS
        const adminFee = Math.round(grossAmount * 0.05 * 100) / 100; // 5% Admin Fee
        const netAmount = Math.round((grossAmount - tdsAmount - adminFee) * 100) / 100;

        batchTotalGross += grossAmount;
        batchTotalTds += tdsAmount;
        batchTotalAdminFee += adminFee;
        batchTotalNet += netAmount;

        const memberInfo = await tx.member.findUnique({
          where: { id: bId },
          select: { id: true, memberCode: true, name: true, mobile: true, email: true, bankDetails: true },
        });

        const commissionType =
          group.membershipLedgers.length > 0 && group.repurchaseLedgers.length > 0
            ? 'COMBINED'
            : group.membershipLedgers.length > 0
            ? 'MEMBERSHIP'
            : 'REPURCHASE';

        // Create DistributionRecord for member
        const record = await tx.distributionRecord.create({
          data: {
            batchId,
            memberId: bId,
            commissionType,
            grossAmount: new Prisma.Decimal(grossAmount),
            tdsAmount: new Prisma.Decimal(tdsAmount),
            adminFee: new Prisma.Decimal(adminFee),
            netAmount: new Prisma.Decimal(netAmount),
            paymentMode: PaymentMode.UPI,
            bankDetails: memberInfo?.bankDetails || Prisma.DbNull,
            status: DistributionRecordStatus.PAID,
            disbursedAt: new Date(),
          },
        });

        // Update membership ledgers: link to record & set status to DISBURSED
        if (group.membershipLedgers.length > 0) {
          const memIds = group.membershipLedgers.map((l) => l.id);
          await tx.membershipCommissionLedger.updateMany({
            where: { id: { in: memIds } },
            data: {
              distributionRecordId: record.id,
              status: CommissionStatus.DISBURSED,
            },
          });
        }

        // Update repurchase ledgers: link to record & set status to DISBURSED
        if (group.repurchaseLedgers.length > 0) {
          const repIds = group.repurchaseLedgers.map((l) => l.id);
          await tx.repurchaseCommissionLedger.updateMany({
            where: { id: { in: repIds } },
            data: {
              distributionRecordId: record.id,
              status: CommissionStatus.DISBURSED,
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

      // 6. Update batch to COMPLETED state with final totals
      const completedBatch = await tx.distributionBatch.update({
        where: { id: batchId },
        data: {
          totalMembers: memberGroupMap.size,
          totalGrossAmount: new Prisma.Decimal(Math.round(batchTotalGross * 100) / 100),
          totalTdsAmount: new Prisma.Decimal(Math.round(batchTotalTds * 100) / 100),
          totalAdminFee: new Prisma.Decimal(Math.round(batchTotalAdminFee * 100) / 100),
          totalNetAmount: new Prisma.Decimal(Math.round(batchTotalNet * 100) / 100),
          status: DistributionBatchStatus.COMPLETED,
          completedAt: new Date(),
        },
        include: {
          records: {
            include: {
              member: { select: { id: true, memberCode: true, name: true, mobile: true } },
            },
          },
        },
      });

      // 7. Fire per-member notification hook for each beneficiary member
      for (const n of notificationParamsList) {
        await this.notificationsService.notifyMemberCommissionDistributed({
          ...n,
          batchNo: completedBatch.batchNo,
        });
      }

      // 8. Log audit action
      await this.auditService.logAction({
        actorId: actorId || null,
        actorRole: actorRole || MemberRole.ADMIN,
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
        records: completedBatch.records.map((r: any) => ({
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

  /**
   * 3. GET /admin/distribution/history — list of past batches with totals
   */
  async getBatchHistory(query: QueryDistributionHistoryDto) {
    const { startDate, endDate, status, search, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.DistributionBatchWhereInput = {};

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

  /**
   * 4. GET /admin/distribution/:batchId — batch detail with every member/amount included
   */
  async getBatchById(batchId: string) {
    const batch = await (this.prisma as any).distributionBatch.findFirst({
      where: {
        OR: [{ id: batchId }, { batchNo: batchId }],
      },
      include: {
        processor: { select: { id: true, memberCode: true, name: true, email: true } },
        records: {
          include: {
            member: { select: { id: true, memberCode: true, name: true, mobile: true, email: true } },
            membershipCommissions: {
              select: { id: true, sourceMemberId: true, level: true, percentage: true, amount: true, createdAt: true },
            },
            repurchaseCommissions: {
              select: { id: true, repurchaseEntryId: true, sourceMemberId: true, level: true, percentage: true, amount: true, createdAt: true },
            },
          },
        },
      },
    });

    if (!batch) {
      throw new NotFoundException(`Distribution batch '${batchId}' not found`);
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
      records: batch.records.map((r: any) => ({
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
        membershipCommissions: r.membershipCommissions.map((m: any) => ({ ...m, amount: Number(m.amount), percentage: Number(m.percentage) })),
        repurchaseCommissions: r.repurchaseCommissions.map((rc: any) => ({ ...rc, amount: Number(rc.amount), percentage: Number(rc.percentage) })),
      })),
    };
  }
}
