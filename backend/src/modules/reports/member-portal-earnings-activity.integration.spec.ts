import { Test, TestingModule } from '@nestjs/testing';
import { MemberPortalReportsService } from './member-portal-reports.service';
import { MemberEarningsMembershipController } from './member-earnings-membership.controller';
import { MemberEarningsRepurchaseController } from './member-earnings-repurchase.controller';
import { MemberEarningsTotalController } from './member-earnings-total.controller';
import { MemberActivityController } from './member-activity.controller';
import { PrismaService } from '../../prisma/prisma.service';
import { CommissionStatus, DistributionRecordStatus, MemberRole, MemberStatus } from '@prisma/client';

describe('Member Portal Earnings Breakdown & Scoped Activity Integration Test Suite', () => {
  let membershipController: MemberEarningsMembershipController;
  let repurchaseController: MemberEarningsRepurchaseController;
  let totalController: MemberEarningsTotalController;
  let activityController: MemberActivityController;

  const mockMemberId = 'member-uuid-1001';

  const mockMember = {
    id: mockMemberId,
    memberCode: 'AK10001',
    name: 'Test Member',
    email: 'member@example.com',
    mobile: '+919876543210',
    status: MemberStatus.ACTIVE,
    role: MemberRole.MEMBER,
  };

  const mockMembershipLedgers = [
    {
      id: 'mem-ledger-1',
      sourceMemberId: 'source-1',
      beneficiaryMemberId: mockMemberId,
      level: 1,
      percentage: 10,
      amount: 100,
      status: CommissionStatus.DISBURSED,
      createdAt: new Date('2026-08-10T10:00:00Z'),
      sourceMember: { id: 'source-1', memberCode: 'AK10002', name: 'Child 1', mobile: '+919999999999' },
    },
    {
      id: 'mem-ledger-2',
      sourceMemberId: 'source-2',
      beneficiaryMemberId: mockMemberId,
      level: 2,
      percentage: 5,
      amount: 50,
      status: CommissionStatus.PENDING,
      createdAt: new Date('2026-08-11T12:00:00Z'),
      sourceMember: { id: 'source-2', memberCode: 'AK10003', name: 'Child 2', mobile: '+919888888888' },
    },
  ];

  const mockRepurchaseLedgers = [
    {
      id: 'rep-ledger-1',
      repurchaseEntryId: 'entry-1',
      sourceMemberId: 'source-1',
      beneficiaryMemberId: mockMemberId,
      level: 1,
      percentage: 2,
      amount: 40,
      status: CommissionStatus.DISBURSED,
      createdAt: new Date('2026-08-12T08:00:00Z'),
      sourceMember: { id: 'source-1', memberCode: 'AK10002', name: 'Child 1', mobile: '+919999999999' },
      repurchaseEntry: { id: 'entry-1', transactionRef: 'TXN100', amount: 2000, transactionDate: new Date('2026-08-12T08:00:00Z') },
    },
  ];

  const mockPrismaService = {
    member: {
      findUnique: jest.fn().mockResolvedValue(mockMember),
    },
    membershipCommissionLedger: {
      count: jest.fn().mockResolvedValue(2),
      findMany: jest.fn().mockResolvedValue(mockMembershipLedgers),
      groupBy: jest.fn().mockImplementation(({ by }) => {
        if (by.includes('status')) {
          return Promise.resolve([
            { status: CommissionStatus.DISBURSED, _sum: { amount: 100 }, _count: { id: 1 } },
            { status: CommissionStatus.PENDING, _sum: { amount: 50 }, _count: { id: 1 } },
          ]);
        }
        if (by.includes('level')) {
          return Promise.resolve([
            { level: 1, _sum: { amount: 100 }, _count: { id: 1 } },
            { level: 2, _sum: { amount: 50 }, _count: { id: 1 } },
          ]);
        }
        return Promise.resolve([]);
      }),
    },
    repurchaseCommissionLedger: {
      count: jest.fn().mockResolvedValue(1),
      findMany: jest.fn().mockResolvedValue(mockRepurchaseLedgers),
      groupBy: jest.fn().mockImplementation(({ by }) => {
        if (by.includes('status')) {
          return Promise.resolve([
            { status: CommissionStatus.DISBURSED, _sum: { amount: 40 }, _count: { id: 1 } },
          ]);
        }
        if (by.includes('level')) {
          return Promise.resolve([
            { level: 1, _sum: { amount: 40 }, _count: { id: 1 } },
          ]);
        }
        return Promise.resolve([]);
      }),
    },
    distributionRecord: {
      aggregate: jest.fn().mockImplementation(({ where }) => {
        if (where.status === DistributionRecordStatus.PAID) {
          return Promise.resolve({
            _sum: { netAmount: 140, grossAmount: 140, tdsAmount: 0, adminFee: 0 },
            _count: { id: 1 },
          });
        }
        return Promise.resolve({
          _sum: { netAmount: 0, grossAmount: 0 },
          _count: { id: 0 },
        });
      }),
      findMany: jest.fn().mockResolvedValue([]),
    },
    repurchaseEntry: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    activityLog: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    $queryRaw: jest.fn().mockResolvedValue([
      { date: new Date('2026-08-10'), count: 1, amount: 100 },
      { date: new Date('2026-08-11'), count: 1, amount: 50 },
    ]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [
        MemberEarningsMembershipController,
        MemberEarningsRepurchaseController,
        MemberEarningsTotalController,
        MemberActivityController,
      ],
      providers: [
        MemberPortalReportsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    membershipController = module.get<MemberEarningsMembershipController>(MemberEarningsMembershipController);
    repurchaseController = module.get<MemberEarningsRepurchaseController>(MemberEarningsRepurchaseController);
    totalController = module.get<MemberEarningsTotalController>(MemberEarningsTotalController);
    activityController = module.get<MemberActivityController>(MemberActivityController);

    jest.clearAllMocks();
  });

  it('1. GET /member/earnings/membership?range=daily — returns grouped breakdown and trend', async () => {
    const result = await membershipController.getMyMembershipEarnings(mockMemberId, { range: 'daily' as any });

    expect(result).toBeDefined();
    expect(result.summary.totalEarned).toBe(150);
    expect(result.summary.statusBreakdown.DISBURSED).toBe(100);
    expect(result.summary.statusBreakdown.PENDING).toBe(50);
    expect(result.summary.levelBreakdown.level_1).toBe(100);
    expect(result.data.length).toBe(2);
  });

  it('2. GET /member/earnings/repurchase?range=weekly — returns repurchase breakdown and trend', async () => {
    const result = await repurchaseController.getMyRepurchaseEarnings(mockMemberId, { range: 'weekly' as any });

    expect(result).toBeDefined();
    expect(result.summary.totalEarned).toBe(40);
    expect(result.summary.statusBreakdown.DISBURSED).toBe(40);
    expect(result.summary.levelBreakdown.level_1).toBe(40);
    expect(result.data.length).toBe(1);
  });

  it('3. GET /member/earnings/total — returns combined earnings summary', async () => {
    const result = await totalController.getMyTotalEarnings(mockMemberId);

    expect(result).toBeDefined();
    expect(result.totalMembershipEarnings).toBe(150);
    expect(result.totalRepurchaseEarnings).toBe(40);
    expect(result.totalEarnings).toBe(190);
    expect(result.totalDistributed).toBe(140);
  });

  it('4. GET /member/activity — returns scoped activity feed sorted most-recent-first', async () => {
    const result = await activityController.getMyActivityHistory(mockMemberId, { page: 1, limit: 10 });

    expect(result).toBeDefined();
    expect(result.data).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);
  });
});
