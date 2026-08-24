import { Test, TestingModule } from '@nestjs/testing';
import { AdminRepurchaseController } from './repurchase.controller';
import { RepurchaseService } from './repurchase.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { RepurchaseCommissionService } from '../repurchase-commission/repurchase-commission.service';
import { MemberRole, MemberStatus } from '@prisma/client';

describe('Admin In-Store Repurchase Core Endpoints Integration Test Suite', () => {
  let controller: AdminRepurchaseController;
  let service: RepurchaseService;
  let prisma: any;

  const mockAdminUser = {
    id: 'admin-uuid-1',
    memberCode: 'ADM-0001',
    role: MemberRole.ADMIN,
  };

  const mockActiveMember = {
    id: 'member-uuid-10',
    memberCode: 'AK10010',
    name: 'Active Member',
    mobile: '+919999999910',
    status: MemberStatus.ACTIVE,
  };

  const mockRepurchaseEntry = {
    id: 'rep-entry-uuid-1',
    transactionRef: 'REP-2026-00001',
    memberId: mockActiveMember.id,
    member: mockActiveMember,
    amount: 2500.0,
    transactionDate: new Date(),
    remarks: 'Store purchase',
    createdBy: mockAdminUser.id,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  beforeEach(async () => {
    prisma = {
      repurchaseEntry: {
        findFirst: jest.fn().mockImplementation(async ({ where }: any) => {
          if (where.transactionRef === 'REP-2026-00001' && !where.id)
            return null; // available ref
          if (where.id === mockRepurchaseEntry.id && where.deletedAt === null)
            return mockRepurchaseEntry;
          return null;
        }),
        findMany: jest.fn().mockResolvedValue([mockRepurchaseEntry]),
        count: jest.fn().mockResolvedValue(1),
        create: jest.fn().mockResolvedValue(mockRepurchaseEntry),
        update: jest
          .fn()
          .mockResolvedValue({ ...mockRepurchaseEntry, amount: 3000 }),
      },
      repurchaseCommissionLedger: {
        count: jest.fn().mockResolvedValue(0), // 0 commissions generated
      },
      member: {
        findUnique: jest.fn().mockImplementation(async ({ where }: any) => {
          if (where.id === mockActiveMember.id) return mockActiveMember;
          return null;
        }),
        findFirst: jest.fn().mockImplementation(async ({ where }: any) => {
          return mockActiveMember;
        }),
      },
      $transaction: jest.fn((cb) => cb(prisma)),
    };

    const auditService = {
      logAction: jest.fn().mockResolvedValue({ id: 'log-1' }),
    };

    const repurchaseCommissionService = {
      calculateForEntry: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminRepurchaseController],
      providers: [
        RepurchaseService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
        {
          provide: RepurchaseCommissionService,
          useValue: repurchaseCommissionService,
        },
      ],
    }).compile();

    controller = module.get<AdminRepurchaseController>(
      AdminRepurchaseController,
    );
    service = module.get<RepurchaseService>(RepurchaseService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  describe('1. POST /admin/repurchase', () => {
    it('should create repurchase entry', async () => {
      const res = await controller.create(
        {
          transactionRef: 'REP-2026-00001',
          memberId: mockActiveMember.id,
          amount: 2500.0,
          remarks: 'Store purchase',
        },
        mockAdminUser.id,
        mockAdminUser.role,
      );

      expect(res.id).toBe(mockRepurchaseEntry.id);
      expect(res.transactionRef).toBe('REP-2026-00001');
    });
  });

  describe('2. GET /admin/repurchase', () => {
    it('should return paginated list of repurchase entries', async () => {
      const res = await controller.findAll({ page: 1, limit: 10 });

      expect(res.data.length).toBe(1);
      expect(res.meta.total).toBe(1);
    });
  });

  describe('3. GET /admin/repurchase/:id', () => {
    it('should return single repurchase entry detail view', async () => {
      const res = await controller.findById(mockRepurchaseEntry.id);

      expect(res.id).toBe(mockRepurchaseEntry.id);
    });
  });

  describe('4. PUT /admin/repurchase/:id', () => {
    it('should update repurchase entry before commission generation', async () => {
      const res = await controller.update(
        mockRepurchaseEntry.id,
        { amount: 3000 },
        mockAdminUser.id,
        mockAdminUser.role,
      );

      expect(res.amount).toBe(3000);
    });
  });

  describe('5. DELETE /admin/repurchase/:id', () => {
    it('should soft-delete repurchase entry before commission generation', async () => {
      const res = await controller.remove(
        mockRepurchaseEntry.id,
        mockAdminUser.id,
        mockAdminUser.role,
      );

      expect(res.message).toContain('soft-deleted successfully');
    });
  });
});
