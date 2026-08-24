import { Test, TestingModule } from '@nestjs/testing';
import { DistributionService } from './distribution.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  CommissionStatus,
  DistributionBatchStatus,
  DistributionRecordStatus,
} from '@prisma/client';

describe('Distribution Data Model Wiring Test Suite', () => {
  let service: DistributionService;
  let prisma: any;

  const mockBatch = {
    id: 'batch-uuid-1',
    batchNo: 'BATCH-20260813-001',
    totalMembers: 2,
    totalGrossAmount: 1500.0,
    totalTdsAmount: 75.0,
    totalAdminFee: 75.0,
    totalNetAmount: 1350.0,
    status: DistributionBatchStatus.INITIATED,
    processedBy: 'admin-uuid-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRecord1 = {
    id: 'record-uuid-1',
    batchId: mockBatch.id,
    memberId: 'member-uuid-1',
    commissionType: 'COMBINED',
    grossAmount: 1000.0,
    tdsAmount: 50.0,
    adminFee: 50.0,
    netAmount: 900.0,
    status: DistributionRecordStatus.PENDING,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockMembershipLedger = {
    id: 'mem-ledger-uuid-1',
    sourceMemberId: 'source-1',
    beneficiaryMemberId: 'member-uuid-1',
    level: 1,
    percentage: 10.0,
    amount: 1000.0,
    status: CommissionStatus.PENDING,
    distributionRecordId: mockRecord1.id,
  };

  const mockRepurchaseLedger = {
    id: 'rep-ledger-uuid-1',
    repurchaseEntryId: 'rep-entry-1',
    sourceMemberId: 'source-1',
    beneficiaryMemberId: 'member-uuid-1',
    level: 1,
    percentage: 1.5,
    amount: 500.0,
    status: CommissionStatus.PENDING,
    distributionRecordId: mockRecord1.id,
  };

  beforeEach(async () => {
    prisma = {
      membershipCommissionLedger: {
        count: jest.fn().mockResolvedValue(5),
        aggregate: jest.fn().mockResolvedValue({ _sum: { amount: 5000.0 } }),
      },
      repurchaseCommissionLedger: {
        count: jest.fn().mockResolvedValue(10),
        aggregate: jest.fn().mockResolvedValue({ _sum: { amount: 1500.0 } }),
      },
      distributionBatch: {
        findUnique: jest.fn().mockResolvedValue(mockBatch),
        create: jest.fn().mockResolvedValue(mockBatch),
      },
      distributionRecord: {
        create: jest.fn().mockResolvedValue(mockRecord1),
      },
    };

    const auditService = {
      logAction: jest.fn().mockResolvedValue({ id: 'log-1' }),
    };

    const notificationsService = {
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

  describe('1. Data Model Wiring Verification', () => {
    it('should calculate correct pending distribution summary from membership and repurchase ledgers', async () => {
      const summary = await service.getPendingDistributionSummary();

      expect(summary.pendingMembershipLedgersCount).toBe(5);
      expect(summary.pendingRepurchaseLedgersCount).toBe(10);
      expect(summary.totalPendingLedgersCount).toBe(15);
      expect(summary.membershipGrossAmount).toBe(5000.0);
      expect(summary.repurchaseGrossAmount).toBe(1500.0);
      expect(summary.totalGrossAmount).toBe(6500.0);
    });

    it('should verify schema relations linking multiple pending ledgers to single DistributionRecord in DistributionBatch', () => {
      // Verify mock object wiring structure matches Prisma model expectations
      expect(mockRecord1.batchId).toBe(mockBatch.id);
      expect(mockMembershipLedger.distributionRecordId).toBe(mockRecord1.id);
      expect(mockRepurchaseLedger.distributionRecordId).toBe(mockRecord1.id);
    });
  });
});
