import { Test, TestingModule } from '@nestjs/testing';
import { MembershipCommissionService, DEFAULT_20_LEVEL_RATES } from './membership-commission.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CommissionStatus, MemberStatus } from '@prisma/client';

describe('Membership Commission 25-Member Deep Chain & Sum-Check Test Suite', () => {
  let service: MembershipCommissionService;
  let prisma: any;

  // 25-Member Upline Tree Map: M25 -> M24 -> M23 -> ... -> M1 -> null
  const chainMembersMap = new Map<string, any>();
  const totalChainDepth = 25;

  for (let i = 1; i <= totalChainDepth; i++) {
    const id = `M${i}`;
    const parentId = i > 1 ? `M${i - 1}` : null;
    chainMembersMap.set(id, {
      id,
      memberCode: `AK100${i.toString().padStart(2, '0')}`,
      name: `Member ${i}`,
      referrerId: parentId,
      status: MemberStatus.ACTIVE,
    });
  }

  const mockLedgerStore: any[] = [];

  beforeEach(async () => {
    mockLedgerStore.length = 0;

    prisma = {
      membershipCommissionConfig: {
        findFirst: jest.fn().mockResolvedValue(null), // Default 20-level rates
        findMany: jest.fn().mockResolvedValue([]),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        upsert: jest.fn(),
      },
      membershipCommissionLedger: {
        count: jest.fn().mockImplementation(async ({ where }: any) => {
          if (where?.sourceMemberId) {
            return mockLedgerStore.filter((l) => l.sourceMemberId === where.sourceMemberId).length;
          }
          return mockLedgerStore.length;
        }),
        findMany: jest.fn().mockImplementation(async ({ where }: any) => {
          let res = [...mockLedgerStore];
          if (where?.sourceMemberId) {
            res = res.filter((l) => l.sourceMemberId === where.sourceMemberId);
          }
          return res;
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

  describe('1. 25-Member Deep Referral Chain Simulation & Exact Level-by-Level Assertions', () => {
    it('should generate exactly 20 commission entries for a 25-member deep chain and assert exact percentage & amount payouts at every level', async () => {
      const packageAmount = 1000;
      // Member M25 registers at bottom of 25-member chain
      const results = await service.calculateForNewMember('M25', packageAmount);

      // Assert strictly 20 ledger entries generated
      expect(results.length).toBe(20);

      // Expected rates map based on default schedule:
      // Level 1: 10%, Level 2: 5%, Level 3: 2.5%, Level 4: 1.5%, Level 5: 1.0%, Level 6: 0.75%, Levels 7..20: 0.5%
      const expectedRates: { level: number; percentage: number; amount: number; beneficiaryId: string }[] = [
        { level: 1, percentage: 10.0, amount: 100.0, beneficiaryId: 'M24' },
        { level: 2, percentage: 5.0, amount: 50.0, beneficiaryId: 'M23' },
        { level: 3, percentage: 2.5, amount: 25.0, beneficiaryId: 'M22' },
        { level: 4, percentage: 1.5, amount: 15.0, beneficiaryId: 'M21' },
        { level: 5, percentage: 1.0, amount: 10.0, beneficiaryId: 'M20' },
        { level: 6, percentage: 0.75, amount: 7.5, beneficiaryId: 'M19' },
      ];

      for (let i = 7; i <= 20; i++) {
        expectedRates.push({
          level: i,
          percentage: 0.5,
          amount: 5.0,
          beneficiaryId: `M${25 - i}`,
        });
      }

      // Assert exact payout at EVERY level 1 through 20
      results.forEach((ledger, index) => {
        const expected = expectedRates[index];
        expect(ledger.level).toBe(expected.level);
        expect(ledger.beneficiaryMemberId).toBe(expected.beneficiaryId);
        expect(ledger.percentage).toBeCloseTo(expected.percentage, 2);
        expect(ledger.amount).toBeCloseTo(expected.amount, 2);
        expect(ledger.status).toBe(CommissionStatus.PENDING);
      });

      // Assert levels 21 to 25 (members M4, M3, M2, M1) receive ZERO ledgers
      const beneficiaryIds = results.map((r) => r.beneficiaryMemberId);
      expect(beneficiaryIds.includes('M4')).toBe(false);
      expect(beneficiaryIds.includes('M3')).toBe(false);
      expect(beneficiaryIds.includes('M2')).toBe(false);
      expect(beneficiaryIds.includes('M1')).toBe(false);
    });
  });

  describe('2. Mathematical Sum-Check Verification', () => {
    it('should pass sum-check: total distributed percentage across all 20 levels equals 27.75% and never exceeds pool budget', async () => {
      const packageAmount = 1000;
      const results = await service.calculateForNewMember('M25', packageAmount);

      // Sum of distributed percentages
      const totalDistributedPercentage = results.reduce((sum, item) => sum + item.percentage, 0);

      // Sum of distributed monetary amount
      const totalDistributedAmount = results.reduce((sum, item) => sum + item.amount, 0);

      // Total expected percentage = 10 + 5 + 2.5 + 1.5 + 1.0 + 0.75 + (14 * 0.5) = 27.75%
      const expectedTotalPoolPercentage = DEFAULT_20_LEVEL_RATES.reduce((sum, item) => sum + item.percentage, 0);
      expect(expectedTotalPoolPercentage).toBeCloseTo(27.75, 2);

      // Assert exact sum check
      expect(totalDistributedPercentage).toBeCloseTo(27.75, 2);
      expect(totalDistributedAmount).toBeCloseTo(277.5, 2);

      // Pool Safety Asserts:
      // 1. Total distributed percentage must never exceed 100%
      expect(totalDistributedPercentage).toBeLessThanOrEqual(100.0);

      // 2. Total distributed percentage must equal intended pool budget
      expect(totalDistributedPercentage).toBeLessThanOrEqual(expectedTotalPoolPercentage);

      // 3. Total distributed monetary amount must never exceed joining package fee
      expect(totalDistributedAmount).toBeLessThanOrEqual(packageAmount);
    });

    it('should maintain mathematical sum-check integrity under custom published commission configs', async () => {
      // Simulate admin publishing a custom rate schedule
      const customRates = [
        { id: 'c1', version: 2, level: 1, percentage: 15.0, isActive: true },
        { id: 'c2', version: 2, level: 2, percentage: 7.5, isActive: true },
        { id: 'c3', version: 2, level: 3, percentage: 3.5, isActive: true },
        ...Array.from({ length: 17 }, (_, i) => ({
          id: `c${i + 4}`,
          version: 2,
          level: i + 4,
          percentage: 0.5,
          isActive: true,
        })),
      ];

      prisma.membershipCommissionConfig.findFirst.mockResolvedValue({ version: 2 });
      prisma.membershipCommissionConfig.findMany.mockResolvedValue(customRates);

      const packageAmount = 1000;
      const results = await service.calculateForNewMember('M25', packageAmount);

      const totalDistributedPercentage = results.reduce((sum, item) => sum + item.percentage, 0);
      const totalDistributedAmount = results.reduce((sum, item) => sum + item.amount, 0);

      // Expected total pool percentage = 15 + 7.5 + 3.5 + (17 * 0.5) = 34.5%
      const expectedCustomPool = 15 + 7.5 + 3.5 + 17 * 0.5;
      expect(expectedCustomPool).toBeCloseTo(34.5, 2);

      expect(totalDistributedPercentage).toBeCloseTo(34.5, 2);
      expect(totalDistributedAmount).toBeCloseTo(345.0, 2);

      expect(totalDistributedPercentage).toBeLessThanOrEqual(100.0);
      expect(totalDistributedAmount).toBeLessThanOrEqual(packageAmount);
    });

    it('should maintain exact mathematical sum-check when uplines have mixed ACTIVE and BLOCKED status', async () => {
      // Set M20 (Level 5) and M15 (Level 10) to BLOCKED
      chainMembersMap.get('M20').status = MemberStatus.BLOCKED;
      chainMembersMap.get('M15').status = MemberStatus.SUSPENDED;

      const packageAmount = 1000;
      const results = await service.calculateForNewMember('M25', packageAmount);

      expect(results.length).toBe(20);

      const pendingSum = results
        .filter((r) => r.status === CommissionStatus.PENDING)
        .reduce((sum, r) => sum + r.amount, 0);

      const holdSum = results
        .filter((r) => r.status === CommissionStatus.HOLD)
        .reduce((sum, r) => sum + r.amount, 0);

      const totalSum = pendingSum + holdSum;

      // Level 5 (M20) is 1.0% = 10.00 (HOLD)
      // Level 10 (M15) is 0.5% = 5.00 (HOLD)
      // Total HOLD sum = 15.00
      expect(holdSum).toBeCloseTo(15.0, 2);
      expect(pendingSum).toBeCloseTo(262.5, 2);

      // Combined sum MUST strictly equal 277.50 (no leakages or missing money)
      expect(totalSum).toBeCloseTo(277.5, 2);
    });
  });
});
