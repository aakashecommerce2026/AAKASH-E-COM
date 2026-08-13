import { Test, TestingModule } from '@nestjs/testing';
import { AdminDistributionController } from './admin-distribution.controller';
import { DistributionService } from './distribution.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CommissionStatus, DistributionBatchStatus, MemberRole } from '@prisma/client';

describe('Admin Distribution Integration Test Suite', () => {
  let controller: AdminDistributionController;
  let service: DistributionService;
  let prisma: any;

  const mockAdminUser = {
    id: 'admin-uuid-1',
    memberCode: 'ADM-0001',
    role: MemberRole.ADMIN,
  };

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

  const mockBatch = {
    id: 'batch-uuid-1',
    batchNo: 'BATCH-20260813-0001',
    totalMembers: 1,
    totalGrossAmount: 1000.0,
    totalTdsAmount: 50.0,
    totalAdminFee: 50.0,
    totalNetAmount: 900.0,
    status: DistributionBatchStatus.COMPLETED,
    processedBy: mockAdminUser.id,
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
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        aggregate: jest.fn().mockResolvedValue({ _sum: { amount: 0 } }),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      distributionBatch: {
        count: jest.fn().mockResolvedValue(0),
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
          grossAmount: 1000.0,
          tdsAmount: 50.0,
          adminFee: 50.0,
          netAmount: 900.0,
        }),
      },
      member: {
        findUnique: jest.fn().mockResolvedValue(mockMember1),
      },
      $transaction: jest.fn((cb) => cb(prisma)),
    };

    const auditService = {
      logAction: jest.fn().mockResolvedValue({ id: 'log-1' }),
    };

    const notificationsService = {
      notifyMemberCommissionDistributed: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminDistributionController],
      providers: [
        DistributionService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
        { provide: NotificationsService, useValue: notificationsService },
      ],
    }).compile();

    controller = module.get<AdminDistributionController>(AdminDistributionController);
    service = module.get<DistributionService>(DistributionService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  describe('1. GET /admin/distribution/pending', () => {
    it('should return pending commission summary', async () => {
      const res = await controller.getPendingCommissions({ page: 1, limit: 10 });

      expect(res.data.length).toBe(1);
      expect(res.summary.totalGrossAmount).toBe(1000.0);
    });
  });

  describe('2. POST /admin/distribution/process', () => {
    it('should process batch', async () => {
      const res = await controller.processBatch(
        { remarks: 'Test Run' },
        mockAdminUser.id,
        mockAdminUser.role,
      );

      expect(res.id).toBe(mockBatch.id);
      expect(res.status).toBe(DistributionBatchStatus.COMPLETED);
    });
  });

  describe('3. GET /admin/distribution/history', () => {
    it('should return batch history', async () => {
      prisma.distributionBatch.count.mockResolvedValue(1);
      const res = await controller.getBatchHistory({ page: 1, limit: 10 });

      expect(res.data.length).toBe(1);
      expect(res.meta.total).toBe(1);
    });
  });

  describe('4. GET /admin/distribution/:batchId', () => {
    it('should return batch details by id', async () => {
      const res = await controller.getBatchById(mockBatch.id);

      expect(res.id).toBe(mockBatch.id);
    });
  });
});
