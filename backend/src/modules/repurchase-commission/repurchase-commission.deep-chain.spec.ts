import { Test, TestingModule } from '@nestjs/testing';
import { RepurchaseCommissionService } from './repurchase-commission.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CommissionStatus, MemberStatus, Prisma } from '@prisma/client';

describe('25-Member Deep Chain & 5% Pool Mathematical Sum-Check Test Suite (Repurchase Commission)', () => {
  let service: RepurchaseCommissionService;
  let prisma: any;

  // Build a 25-level deep member chain: M25 -> M24 -> ... -> M1 -> null
  const membersMap = new Map<string, any>();
  const membersList: any[] = [];

  for (let i = 1; i <= 25; i++) {
    const id = `member-uuid-${i}`;
    const memberCode = `AK100${i.toString().padStart(2, '0')}`;
    const referrerId = i > 1 ? `member-uuid-${i - 1}` : null;
    const member = {
      id,
      memberCode,
      name: `Member ${i}`,
      referrerId,
      status: MemberStatus.ACTIVE,
    };
    membersMap.set(id, member);
    membersList.push(member);
  }

  const mockRepurchaseEntry = {
    id: 'rep-entry-deep-25',
    transactionRef: 'REP-DEEP-25',
    memberId: 'member-uuid-25', // M25 buys ₹10,000 repurchase
    amount: new Prisma.Decimal(10000.0), // ₹10,000 purchase amount
    transactionDate: new Date('2026-08-10T10:00:00Z'),
    deletedAt: null,
  };

  beforeEach(async () => {
    const createdLedgers: any[] = [];

    prisma = {
      repurchaseEntry: {
        findFirst: jest.fn().mockImplementation(async ({ where }: any) => {
          if (where.id === mockRepurchaseEntry.id && where.deletedAt === null) {
            return mockRepurchaseEntry;
          }
          return null;
        }),
      },
      member: {
        findUnique: jest.fn().mockImplementation(async ({ where }: any) => {
          return membersMap.get(where.id) || null;
        }),
        findMany: jest.fn().mockImplementation(async () => membersList),
      },
      repurchaseCommissionConfig: {
        findFirst: jest.fn().mockResolvedValue(null), // use fallback 20-level defaults
        findMany: jest.fn().mockResolvedValue([]),
      },
      repurchaseCommissionLedger: {
        create: jest.fn().mockImplementation(async ({ data }: any) => {
          const ledger = {
            id: `ledger-uuid-${createdLedgers.length + 1}`,
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          createdLedgers.push(ledger);
          return ledger;
        }),
      },
    };

    const auditService = {
      logAction: jest.fn().mockResolvedValue({ id: 'log-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RepurchaseCommissionService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<RepurchaseCommissionService>(
      RepurchaseCommissionService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('1. 25-Member Deep Chain Simulation & 20-Level Depth Cap', () => {
    it('should generate exactly 20 commission ledgers for 25-deep chain and stop strictly at level 20', async () => {
      const ledgers = await service.calculateForEntry('rep-entry-deep-25');

      // 1. Exactly 20 ledgers generated
      expect(ledgers.length).toBe(20);

      // 2. Beneficiaries must be M24 (Level 1) down to M5 (Level 20)
      expect(ledgers[0].beneficiaryMemberId).toBe('member-uuid-24'); // Level 1 (M24)
      expect(ledgers[0].level).toBe(1);

      expect(ledgers[19].beneficiaryMemberId).toBe('member-uuid-5'); // Level 20 (M5)
      expect(ledgers[19].level).toBe(20);

      // 3. Members M4, M3, M2, M1 (levels 21 to 24) must receive 0 ledgers
      const beneficiaryIds = ledgers.map((l) => l.beneficiaryMemberId);
      expect(beneficiaryIds.includes('member-uuid-4')).toBe(false);
      expect(beneficiaryIds.includes('member-uuid-3')).toBe(false);
      expect(beneficiaryIds.includes('member-uuid-2')).toBe(false);
      expect(beneficiaryIds.includes('member-uuid-1')).toBe(false);
    });

    it('should calculate exact percentage and amount payouts at every level for ₹10,000 repurchase', async () => {
      const ledgers = await service.calculateForEntry('rep-entry-deep-25');

      // Level 1: 1.50% of 10,000 = ₹150.00
      expect(ledgers[0].level).toBe(1);
      expect(ledgers[0].percentage).toBe(1.5);
      expect(ledgers[0].amount).toBe(150.0);

      // Level 2: 0.75% of 10,000 = ₹75.00
      expect(ledgers[1].level).toBe(2);
      expect(ledgers[1].percentage).toBe(0.75);
      expect(ledgers[1].amount).toBe(75.0);

      // Level 3: 0.45% of 10,000 = ₹45.00
      expect(ledgers[2].level).toBe(3);
      expect(ledgers[2].percentage).toBe(0.45);
      expect(ledgers[2].amount).toBe(45.0);

      // Level 4: 0.30% of 10,000 = ₹30.00
      expect(ledgers[3].level).toBe(4);
      expect(ledgers[3].percentage).toBe(0.3);
      expect(ledgers[3].amount).toBe(30.0);

      // Level 5: 0.20% of 10,000 = ₹20.00
      expect(ledgers[4].level).toBe(5);
      expect(ledgers[4].percentage).toBe(0.2);
      expect(ledgers[4].amount).toBe(20.0);

      // Levels 6 to 15: 0.15% of 10,000 = ₹15.00
      for (let lvl = 6; lvl <= 15; lvl++) {
        const item = ledgers.find((l) => l.level === lvl)!;
        expect(item.percentage).toBe(0.15);
        expect(item.amount).toBe(15.0);
      }

      // Level 16: 0.07% of 10,000 = ₹7.00
      expect(ledgers[15].level).toBe(16);
      expect(ledgers[15].percentage).toBe(0.07);
      expect(ledgers[15].amount).toBe(7.0);

      // Levels 17 to 19: 0.06% of 10,000 = ₹6.00
      for (let lvl = 17; lvl <= 19; lvl++) {
        const item = ledgers.find((l) => l.level === lvl)!;
        expect(item.percentage).toBe(0.06);
        expect(item.amount).toBe(6.0);
      }

      // Level 20: 0.05% of 10,000 = ₹5.00
      expect(ledgers[19].level).toBe(20);
      expect(ledgers[19].percentage).toBe(0.05);
      expect(ledgers[19].amount).toBe(5.0);
    });
  });

  describe('2. Mathematical Sum-Check Safeguard Tests', () => {
    it('sum of percentage payouts across all levels should equal EXACTLY 5.00% (never exceed 5% pool)', async () => {
      const ledgers = await service.calculateForEntry('rep-entry-deep-25');

      const totalPercentageSum = ledgers.reduce(
        (acc, l) => acc + l.percentage,
        0,
      );
      const roundedPercentage = Math.round(totalPercentageSum * 100) / 100;

      expect(roundedPercentage).toBe(5.0);
      expect(roundedPercentage).toBeLessThanOrEqual(5.0);
    });

    it('sum of total distributed commission amount should equal EXACTLY ₹500.00 for ₹10,000 repurchase (never exceed 5% of amount)', async () => {
      const ledgers = await service.calculateForEntry('rep-entry-deep-25');

      const totalAmountSum = ledgers.reduce((acc, l) => acc + l.amount, 0);
      const roundedAmount = Math.round(totalAmountSum * 100) / 100;

      const expectedPoolAmount = (10000.0 * 5.0) / 100; // ₹500.00
      expect(roundedAmount).toBe(expectedPoolAmount);
      expect(roundedAmount).toBeLessThanOrEqual(expectedPoolAmount);
    });
  });

  describe('3. Shallow Tree Sum-Check Verification', () => {
    it('should handle shallower tree (5 upline levels) without error and sum should be <= 5%', async () => {
      // M5 is purchaser, has 4 uplines (M4, M3, M2, M1)
      const shallowEntry = {
        id: 'rep-entry-shallow-5',
        memberId: 'member-uuid-5',
        amount: new Prisma.Decimal(5000.0), // ₹5,000 purchase
        deletedAt: null,
      };

      prisma.repurchaseEntry.findFirst.mockImplementation(
        async ({ where }: any) => {
          if (where.id === 'rep-entry-shallow-5') return shallowEntry;
          return null;
        },
      );

      const ledgers = await service.calculateForEntry('rep-entry-shallow-5');

      expect(ledgers.length).toBe(4); // M4, M3, M2, M1

      const totalPercentageSum = ledgers.reduce(
        (acc, l) => acc + l.percentage,
        0,
      );
      const totalAmountSum = ledgers.reduce((acc, l) => acc + l.amount, 0);

      // Levels 1..4 sum: 1.50 + 0.75 + 0.45 + 0.30 = 3.00%
      expect(totalPercentageSum).toBe(3.0);
      expect(totalPercentageSum).toBeLessThanOrEqual(5.0);

      // Total amount: 3% of 5,000 = ₹150.00 <= ₹250 (5%)
      expect(totalAmountSum).toBe(150.0);
      expect(totalAmountSum).toBeLessThanOrEqual(250.0);
    });

    it('should return 0 ledgers for root member with no uplines', async () => {
      const rootEntry = {
        id: 'rep-entry-root-1',
        memberId: 'member-uuid-1', // M1 has no referrer
        amount: new Prisma.Decimal(10000.0),
        deletedAt: null,
      };

      prisma.repurchaseEntry.findFirst.mockImplementation(
        async ({ where }: any) => {
          if (where.id === 'rep-entry-root-1') return rootEntry;
          return null;
        },
      );

      const ledgers = await service.calculateForEntry('rep-entry-root-1');
      expect(ledgers.length).toBe(0);
    });
  });

  describe('4. Account Status Policy Verification (ACTIVE vs non-ACTIVE)', () => {
    it('should set status = PENDING for ACTIVE uplines and status = HOLD for BLOCKED/INACTIVE uplines', async () => {
      // Set M23 (Level 2) as BLOCKED and M21 (Level 4) as SUSPENDED
      const modifiedMembersMap = new Map(membersMap);
      modifiedMembersMap.set('member-uuid-23', {
        ...membersMap.get('member-uuid-23'),
        status: MemberStatus.BLOCKED,
      });
      modifiedMembersMap.set('member-uuid-21', {
        ...membersMap.get('member-uuid-21'),
        status: MemberStatus.SUSPENDED,
      });

      prisma.member.findUnique.mockImplementation(async ({ where }: any) => {
        return modifiedMembersMap.get(where.id) || null;
      });

      const ledgers = await service.calculateForEntry('rep-entry-deep-25');

      const level1 = ledgers.find((l) => l.level === 1)!;
      const level2 = ledgers.find((l) => l.level === 2)!;
      const level3 = ledgers.find((l) => l.level === 3)!;
      const level4 = ledgers.find((l) => l.level === 4)!;

      expect(level1.status).toBe(CommissionStatus.PENDING); // Active
      expect(level2.status).toBe(CommissionStatus.HOLD); // Blocked
      expect(level3.status).toBe(CommissionStatus.PENDING); // Active
      expect(level4.status).toBe(CommissionStatus.HOLD); // Suspended
    });
  });
});
