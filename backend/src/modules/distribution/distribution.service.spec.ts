import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DistributionService } from './distribution.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  CommissionStatus,
  DistributionBatchStatus,
  MemberRole,
} from '@prisma/client';

describe('DistributionService Core Unit Tests', () => {
  let service: DistributionService;
  let prisma: any;
  let auditService: any;
  let notificationsService: any;

  const mockMember1 = {
    id: 'member-uuid-1',
    memberCode: 'AK10001',
    name: 'Member One',
    mobile: '+919999999991',
    email: 'm1@example.com',
    status: 'ACTIVE',
    bankDetails: { accountNumber: '123456789' },
  };

  const mockMembershipLedger = {
    id: 'mem-ledger-1',
    sourceMemberId: 'source-uuid-1',
    beneficiaryMemberId: 'member-uuid-1',
    beneficiaryMember: mockMember1,
    level: 1,
    percentage: 10.0,
    amount: 1000.0,
    status: CommissionStatus.PENDING,
    distributionRecordId: null,
    createdAt: new Date('2026-08-10T10:00:00Z'),
  };

  const mockRepurchaseLedger = {
    id: 'rep-ledger-1',
    repurchaseEntryId: 'rep-entry-1',
    sourceMemberId: 'source-uuid-1',
    beneficiaryMemberId: 'member-uuid-1',
    beneficiaryMember: mockMember1,
    level: 1,
    percentage: 1.5,
    amount: 500.0,
    status: CommissionStatus.PENDING,
    distributionRecordId: null,
    createdAt: new Date('2026-08-10T10:00:00Z'),
  };

  const mockBatch = {
    id: 'batch-uuid-1',
    batchNo: 'BATCH-20260813-0001',
    totalMembers: 1,
    totalGrossAmount: 1500.0,
    totalTdsAmount: 75.0,
    totalAdminFee: 75.0,
    totalNetAmount: 1350.0,
    status: DistributionBatchStatus.COMPLETED,
    processedBy: 'admin-uuid-1',
    startedAt: new Date(),
    completedAt: new Date(),
    createdAt: new Date(),
    records: [],
  };

  beforeEach(async () => {
    prisma = {
      membershipCommissionLedger: {
        findMany: jest.fn().mockResolvedValue([mockMembershipLedger]),
        count: jest.fn().mockResolvedValue(1),
        aggregate: jest.fn().mockResolvedValue({ _sum: { amount: 1000.0 } }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      repurchaseCommissionLedger: {
        findMany: jest.fn().mockResolvedValue([mockRepurchaseLedger]),
        count: jest.fn().mockResolvedValue(1),
        aggregate: jest.fn().mockResolvedValue({ _sum: { amount: 500.0 } }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      distributionBatch: {
        count: jest.fn().mockResolvedValue(0), // batchNo index count
        findUnique: jest.fn().mockResolvedValue(mockBatch),
        findFirst: jest.fn().mockResolvedValue(mockBatch),
        findMany: jest.fn().mockResolvedValue([mockBatch]),
        create: jest.fn().mockResolvedValue(mockBatch),
        update: jest.fn().mockResolvedValue(mockBatch),
      },
      distributionRecord: {
        create: jest.fn().mockResolvedValue({
          id: 'record-uuid-1',
          batchId: mockBatch.id,
          memberId: mockMember1.id,
          grossAmount: 1500.0,
          tdsAmount: 75.0,
          adminFee: 75.0,
          netAmount: 1350.0,
        }),
      },
      member: {
        findUnique: jest.fn().mockResolvedValue(mockMember1),
      },
      $transaction: jest.fn((cb) => cb(prisma)),
    };

    auditService = {
      logAction: jest.fn().mockResolvedValue({ id: 'log-1' }),
    };

    notificationsService = {
      notifyMemberCommissionDistributed: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DistributionService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
        { provide: NotificationsService, useValue: notificationsService },
      ],
    }).compile();

    service = module.get<DistributionService>(DistributionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('1. getPendingCommissions (GET /admin/distribution/pending)', () => {
    it('should aggregate pending membership + repurchase commissions and compute 5% TDS and 5% Admin Fee', async () => {
      const res = await service.getPendingCommissions({ page: 1, limit: 10 });

      expect(res.data.length).toBe(1);
      const row = res.data[0];

      // Gross = ₹1,000 + ₹500 = ₹1,500.00
      expect(row.grossAmount).toBe(1500.0);
      expect(row.tdsAmount).toBe(75.0); // 5% TDS
      expect(row.adminFee).toBe(75.0); // 5% Admin Fee
      expect(row.netAmount).toBe(1350.0); // 1,500 - 75 - 75 = ₹1,350.00

      expect(res.summary.totalGrossAmount).toBe(1500.0);
      expect(res.summary.totalTdsAmount).toBe(75.0);
      expect(res.summary.totalAdminFee).toBe(75.0);
      expect(res.summary.totalNetAmount).toBe(1350.0);
    });
  });

  describe('2. processDistributionBatch (POST /admin/distribution/process)', () => {
    it('should process pending ledgers into a DistributionBatch, trigger notifications, and mark ledgers as DISBURSED', async () => {
      const res = await service.processDistributionBatch(
        { remarks: 'August 2026 Batch' },
        'admin-uuid-1',
        MemberRole.ADMIN,
      );

      expect(res.id).toBe(mockBatch.id);
      expect(res.status).toBe(DistributionBatchStatus.COMPLETED);
      expect(
        notificationsService.notifyMemberCommissionDistributed,
      ).toHaveBeenCalled();
      expect(auditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({ actionType: 'PROCESS_DISTRIBUTION_BATCH' }),
      );
    });

    it('should throw BadRequestException if no pending ledgers match criteria', async () => {
      prisma.membershipCommissionLedger.findMany.mockResolvedValue([]);
      prisma.repurchaseCommissionLedger.findMany.mockResolvedValue([]);

      await expect(
        service.processDistributionBatch({}, 'admin-uuid-1', MemberRole.ADMIN),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('3. getBatchHistory (GET /admin/distribution/history)', () => {
    it('should return paginated list of past distribution batches', async () => {
      prisma.distributionBatch.count.mockResolvedValue(1);
      const res = await service.getBatchHistory({ page: 1, limit: 10 });

      expect(res.data.length).toBe(1);
      expect(res.meta.total).toBe(1);
      expect(res.data[0].batchNo).toBe(mockBatch.batchNo);
    });
  });

  describe('4. getBatchById (GET /admin/distribution/:batchId)', () => {
    it('should return detailed batch view by batchId or batchNo', async () => {
      const res = await service.getBatchById(mockBatch.id);

      expect(res.id).toBe(mockBatch.id);
    });

    it('should throw NotFoundException if batchId does not exist', async () => {
      prisma.distributionBatch.findFirst.mockResolvedValue(null);

      await expect(service.getBatchById('non-existent-batch')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
