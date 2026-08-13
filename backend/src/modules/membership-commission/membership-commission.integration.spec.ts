import { Test, TestingModule } from '@nestjs/testing';
import { MembershipCommissionService } from './membership-commission.service';
import { MembershipCommissionController } from './membership-commission.controller';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { MemberRole, CommissionStatus } from '@prisma/client';

describe('MembershipCommission Engine Integration Test Suite', () => {
  let controller: MembershipCommissionController;
  let service: MembershipCommissionService;
  let prisma: any;

  const mockAdminUser = {
    id: 'admin-uuid-1',
    memberCode: 'ADM-0001',
    role: MemberRole.ADMIN,
  };

  const mockMembersMap = new Map<string, any>([
    [
      'member-new-1',
      {
        id: 'member-new-1',
        memberCode: 'AK10005',
        name: 'New Registered Member',
        referrerId: 'member-upline-1',
        status: 'ACTIVE',
      },
    ],
    [
      'member-upline-1',
      {
        id: 'member-upline-1',
        memberCode: 'AK10004',
        name: 'Level 1 Sponsor',
        referrerId: 'member-upline-2',
        status: 'ACTIVE',
      },
    ],
    [
      'member-upline-2',
      {
        id: 'member-upline-2',
        memberCode: 'AK10003',
        name: 'Level 2 Upline',
        referrerId: 'member-upline-3',
        status: 'ACTIVE',
      },
    ],
    [
      'member-upline-3',
      {
        id: 'member-upline-3',
        memberCode: 'AK10002',
        name: 'Level 3 Upline',
        referrerId: null,
        status: 'ACTIVE',
      },
    ],
  ]);

  const mockLedgersStore: any[] = [];

  beforeEach(async () => {
    mockLedgersStore.length = 0;

    prisma = {
      membershipCommissionConfig: {
        findFirst: jest.fn().mockResolvedValue(null), // fallback to 20-level defaults
        findMany: jest.fn().mockResolvedValue([]),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        upsert: jest.fn().mockImplementation(({ create }: any) =>
          Promise.resolve({ id: `cfg-${create.version}-${create.level}`, ...create }),
        ),
      },
      membershipCommissionLedger: {
        count: jest.fn().mockImplementation(async ({ where }: any) => {
          if (where?.sourceMemberId) {
            return mockLedgersStore.filter((l) => l.sourceMemberId === where.sourceMemberId).length;
          }
          return mockLedgersStore.length;
        }),
        findMany: jest.fn().mockImplementation(async ({ where }: any) => {
          let res = [...mockLedgersStore];
          if (where?.sourceMemberId) {
            res = res.filter((l) => l.sourceMemberId === where.sourceMemberId);
          }
          return res;
        }),
        findUnique: jest.fn().mockImplementation(async ({ where }: any) => {
          return mockLedgersStore.find((l) => l.id === where.id) || null;
        }),
        create: jest.fn().mockImplementation(async ({ data }: any) => {
          const ledger = {
            id: `led-uuid-${mockLedgersStore.length + 1}`,
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          mockLedgersStore.push(ledger);
          return ledger;
        }),
      },
      member: {
        findUnique: jest.fn().mockImplementation(async ({ where }: any) => {
          return mockMembersMap.get(where.id) || null;
        }),
      },
      $transaction: jest.fn((cb) => cb(prisma)),
    };

    const auditService = {
      logAction: jest.fn().mockResolvedValue({ id: 'log-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MembershipCommissionController],
      providers: [
        MembershipCommissionService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    controller = module.get<MembershipCommissionController>(MembershipCommissionController);
    service = module.get<MembershipCommissionService>(MembershipCommissionService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  describe('1. Active Rate Schedule Configuration', () => {
    it('should return default seeded 20-level percentage table from GET /config', async () => {
      const config = await controller.getConfig();

      expect(config.length).toBe(20);
      expect(config[0].level).toBe(1);
      expect(config[0].percentage).toBe(10);
      expect(config[1].level).toBe(2);
      expect(config[1].percentage).toBe(5);
      expect(config[2].level).toBe(3);
      expect(config[2].percentage).toBe(2.5);
    });

    it('should allow Admin to publish and activate version 2 of rates schedule from POST /config', async () => {
      const newRates = [
        { level: 1, percentage: 12.0, description: 'New Level 1' },
        { level: 2, percentage: 6.0, description: 'New Level 2' },
        { level: 3, percentage: 3.0, description: 'New Level 3' },
      ];

      const res = await controller.createConfig(
        { version: 2, rates: newRates, isActive: true },
        mockAdminUser.id,
      );

      expect(res.length).toBe(3);
      expect(res[0].percentage).toBe(12.0);
      expect(prisma.membershipCommissionConfig.updateMany).toHaveBeenCalledWith({
        where: { isActive: true },
        data: { isActive: false },
      });
    });
  });

  describe('2. Registration Commission Trigger & Ledger Query', () => {
    it('should calculate commissions up to available upline levels upon triggering for new member', async () => {
      const res = await controller.triggerRegistrationCommission('member-new-1', 1000);

      expect(res.length).toBe(3); // Level 1 (upline 1), Level 2 (upline 2), Level 3 (upline 3)

      // Level 1: 10% of 1000 = 100
      expect(res[0].level).toBe(1);
      expect(res[0].beneficiaryMemberId).toBe('member-upline-1');
      expect(res[0].percentage).toBe(10);
      expect(res[0].amount).toBe(100);
      expect(res[0].status).toBe('PENDING');

      // Level 2: 5% of 1000 = 50
      expect(res[1].level).toBe(2);
      expect(res[1].beneficiaryMemberId).toBe('member-upline-2');
      expect(res[1].percentage).toBe(5);
      expect(res[1].amount).toBe(50);
      expect(res[1].status).toBe('PENDING');

      // Level 3: 2.5% of 1000 = 25
      expect(res[2].level).toBe(3);
      expect(res[2].beneficiaryMemberId).toBe('member-upline-3');
      expect(res[2].percentage).toBe(2.5);
      expect(res[2].amount).toBe(25);
      expect(res[2].status).toBe('PENDING');
    });

    it('should query generated ledgers via GET /ledger', async () => {
      await controller.triggerRegistrationCommission('member-new-1', 1000);

      const queryRes = await controller.findAll({
        sourceMemberId: 'member-new-1',
      });

      expect(queryRes.data.length).toBe(3);
      expect(queryRes.meta.total).toBe(3);
    });
  });
});
