import { Test, TestingModule } from '@nestjs/testing';
import { MembershipCommissionService } from './membership-commission.service';
import { PrismaService } from '../../prisma/prisma.service';
import { MemberStatus } from '@prisma/client';
import { AuditService } from '../audit/audit.service';

describe('MembershipCommissionService - 20-Level Deep Chain Test Suite', () => {
  let service: MembershipCommissionService;
  let prisma: any;
  let chainMembersMap: Map<string, any>;
  let mockLedgerStore: any[];

  beforeEach(async () => {
    mockLedgerStore = [];
    chainMembersMap = new Map();

    // Create 25-member linear referral chain: M1 -> M2 -> M3 -> ... -> M25
    for (let i = 1; i <= 25; i++) {
      const memberId = `M${i}`;
      const referrerId = i === 1 ? null : `M${i - 1}`;
      chainMembersMap.set(memberId, {
        id: memberId,
        memberCode: `AK1000${i}`,
        name: `Member ${i}`,
        mobile: `+9190000000${i.toString().padStart(2, '0')}`,
        referrerId,
        status: MemberStatus.ACTIVE,
        joiningDate: new Date(),
      });
    }

    prisma = {
      membershipCommissionConfig: {
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([
          { level: 1, percentage: 10.0, isActive: true },
          { level: 2, percentage: 5.0, isActive: true },
          { level: 3, percentage: 2.5, isActive: true },
          { level: 4, percentage: 1.5, isActive: true },
          { level: 5, percentage: 1.0, isActive: true },
          { level: 6, percentage: 0.75, isActive: true },
          ...Array.from({ length: 14 }, (_, idx) => ({
            level: idx + 7,
            percentage: 0.5,
            isActive: true,
          })),
        ]),
      },
      membershipCommissionLedger: {
        count: jest.fn().mockResolvedValue(0),
        findUnique: jest.fn().mockImplementation(async ({ where }: any) => {
          return mockLedgerStore.find(
            (l) => l.sourceMemberId === where.sourceMemberId_level.sourceMemberId && l.level === where.sourceMemberId_level.level,
          ) || null;
        }),
        createMany: jest.fn().mockImplementation(async ({ data }: any) => {
          const arr = Array.isArray(data) ? data : [data];
          const res = [];
          for (const item of arr) {
            const ledger = {
              id: `led-uuid-${mockLedgerStore.length + 1}`,
              ...item,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            mockLedgerStore.push(ledger);
            res.push(ledger);
          }
          return { count: res.length };
        }),
        create: jest.fn().mockImplementation(async ({ data }: any) => {
          const ledger = {
            id: `led-uuid-${mockLedgerStore.length + 1}`,
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          mockLedgerStore.push(ledger);
          return ledger;
        }),
      },
      member: {
        findUnique: jest.fn().mockImplementation(async ({ where }: any) => {
          return chainMembersMap.get(where.id) || null;
        }),
      },
      $transaction: jest.fn((cb) => cb(prisma)),
    };

    const auditService = {
      logAction: jest.fn().mockResolvedValue({ id: 'audit-log-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MembershipCommissionService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<MembershipCommissionService>(MembershipCommissionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('1. 25-Member Deep Referral Chain Simulation & Level-by-Level Assertions', () => {
    it('should generate exactly 20 commission entries for a 25-member deep chain', async () => {
      const packageAmount = 1000;
      const results = await service.calculateForNewMember('M25', packageAmount);

      expect(results.length).toBe(20);
      const totalPayout = results.reduce((sum, r) => sum + Number(r.amount), 0);
      expect(totalPayout).toBeCloseTo(277.5, 2);
    });
  });
});
