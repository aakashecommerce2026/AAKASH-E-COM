import { Test, TestingModule } from '@nestjs/testing';
import { RepurchaseController } from './repurchase.controller';
import { RepurchaseService } from './repurchase.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { MemberRole, MemberStatus } from '@prisma/client';

describe('Admin In-Store Repurchase Integration Test Suite', () => {
  let controller: RepurchaseController;
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
  };

  beforeEach(async () => {
    prisma = {
      repurchaseEntry: {
        findUnique: jest.fn().mockImplementation(async ({ where }: any) => {
          if (where.transactionRef === 'REP-2026-00001') return null; // available
          if (where.id === mockRepurchaseEntry.id) return mockRepurchaseEntry;
          return null;
        }),
        findMany: jest.fn().mockResolvedValue([mockRepurchaseEntry]),
        count: jest.fn().mockResolvedValue(1),
        create: jest.fn().mockResolvedValue(mockRepurchaseEntry),
        update: jest.fn().mockResolvedValue({ ...mockRepurchaseEntry, amount: 3000 }),
        delete: jest.fn().mockResolvedValue(mockRepurchaseEntry),
      },
      member: {
        findUnique: jest.fn().mockImplementation(async ({ where }: any) => {
          if (where.id === mockActiveMember.id) return mockActiveMember;
          return null;
        }),
      },
    };

    const auditService = {
      logAction: jest.fn().mockResolvedValue({ id: 'log-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RepurchaseController],
      providers: [
        RepurchaseService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    controller = module.get<RepurchaseController>(RepurchaseController);
    service = module.get<RepurchaseService>(RepurchaseService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  describe('1. POST /repurchases', () => {
    it('should create repurchase entry', async () => {
      const res = await controller.create(
        {
          transactionRef: 'REP-2026-00001',
          memberId: mockActiveMember.id,
          amount: 2500.0,
          remarks: 'Store purchase',
        },
        mockAdminUser.id,
      );

      expect(res.id).toBe(mockRepurchaseEntry.id);
      expect(res.transactionRef).toBe('REP-2026-00001');
    });
  });

  describe('2. GET /repurchases', () => {
    it('should return paginated list of repurchase entries', async () => {
      const res = await controller.findAll({ page: 1, limit: 10 });

      expect(res.data.length).toBe(1);
      expect(res.meta.total).toBe(1);
    });
  });

  describe('3. GET /repurchases/:id', () => {
    it('should return single repurchase entry', async () => {
      const res = await controller.findById(mockRepurchaseEntry.id);

      expect(res.id).toBe(mockRepurchaseEntry.id);
    });
  });

  describe('4. PUT /repurchases/:id', () => {
    it('should update repurchase entry', async () => {
      const res = await controller.update(
        mockRepurchaseEntry.id,
        { amount: 3000 },
        mockAdminUser.id,
      );

      expect(res.amount).toBe(3000);
    });
  });

  describe('5. DELETE /repurchases/:id', () => {
    it('should delete repurchase entry', async () => {
      const res = await controller.remove(mockRepurchaseEntry.id, mockAdminUser.id);

      expect(res.message).toContain('deleted successfully');
    });
  });
});
