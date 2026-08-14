import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { DashboardService } from './dashboard.service';
import { DashboardCacheService } from './dashboard-cache.service';
import { PrismaService } from '../../prisma/prisma.service';
import { MemberStatus, CommissionStatus } from '@prisma/client';
import { ActivityCategory } from './dto/query-activity.dto';
import { NotFoundException } from '@nestjs/common';

describe('DashboardService', () => {
  let service: DashboardService;
  let cacheService: DashboardCacheService;
  let prisma: PrismaService;

  const mockPrismaService = {
    member: {
      count: jest.fn(),
      groupBy: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    membershipCommissionLedger: {
      groupBy: jest.fn(),
      findMany: jest.fn(),
    },
    repurchaseCommissionLedger: {
      groupBy: jest.fn(),
      findMany: jest.fn(),
    },
    distributionRecord: {
      aggregate: jest.fn(),
    },
    repurchaseEntry: {
      count: jest.fn(),
      aggregate: jest.fn(),
      findMany: jest.fn(),
    },
    distributionBatch: {
      findMany: jest.fn(),
    },
    activityLog: {
      findMany: jest.fn(),
    },
    $queryRaw: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockImplementation((key: string) => {
      if (key === 'REDIS_HOST') return 'localhost';
      if (key === 'REDIS_PORT') return 6379;
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        DashboardCacheService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    cacheService = module.get<DashboardCacheService>(DashboardCacheService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
    await cacheService.clearDashboardCache();
  });

  describe('getMemberStats', () => {
    it('should aggregate member counts and status breakdown correctly', async () => {
      mockPrismaService.member.count
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(5)   // today
        .mockResolvedValueOnce(20)  // week
        .mockResolvedValueOnce(50); // month

      mockPrismaService.member.groupBy.mockResolvedValueOnce([
        { status: MemberStatus.ACTIVE, _count: { id: 80 } },
        { status: MemberStatus.INACTIVE, _count: { id: 15 } },
        { status: MemberStatus.BLOCKED, _count: { id: 5 } },
      ]);

      mockPrismaService.$queryRaw.mockResolvedValueOnce([
        { date: new Date('2026-08-14'), count: 5 },
      ]);

      const res = await service.getMemberStats({ refresh: true });

      expect(res.totalMembers).toBe(100);
      expect(res.joinedToday).toBe(5);
      expect(res.joinedThisWeek).toBe(20);
      expect(res.joinedThisMonth).toBe(50);
      expect(res.statusBreakdown).toEqual({
        ACTIVE: 80,
        INACTIVE: 15,
        PENDING: 0,
        BLOCKED: 5,
        SUSPENDED: 0,
      });
      expect(res.registrationTrend).toBeDefined();
    });

    it('should utilize cache on subsequent calls when refresh is false', async () => {
      mockPrismaService.member.count
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(5);

      mockPrismaService.member.groupBy.mockResolvedValueOnce([
        { status: MemberStatus.ACTIVE, _count: { id: 10 } },
      ]);

      mockPrismaService.$queryRaw.mockResolvedValueOnce([]);

      const firstCall = await service.getMemberStats({ refresh: false });
      expect(mockPrismaService.member.count).toHaveBeenCalledTimes(4);

      // Second call should return cached response without calling DB
      const secondCall = await service.getMemberStats({ refresh: false });
      expect(mockPrismaService.member.count).toHaveBeenCalledTimes(4);
      expect(secondCall).toEqual(firstCall);
    });
  });

  describe('getEarningsStats', () => {
    it('should aggregate membership earnings, repurchase earnings, distributed & pending payouts', async () => {
      mockPrismaService.membershipCommissionLedger.groupBy.mockResolvedValueOnce([
        { status: CommissionStatus.DISBURSED, _sum: { amount: 5000 }, _count: { id: 10 } },
        { status: CommissionStatus.PENDING, _sum: { amount: 1000 }, _count: { id: 2 } },
      ]);

      mockPrismaService.repurchaseCommissionLedger.groupBy.mockResolvedValueOnce([
        { status: CommissionStatus.DISBURSED, _sum: { amount: 3000 }, _count: { id: 6 } },
        { status: CommissionStatus.PENDING, _sum: { amount: 500 }, _count: { id: 1 } },
      ]);

      mockPrismaService.distributionRecord.aggregate
        .mockResolvedValueOnce({
          _sum: { netAmount: 7000, grossAmount: 8000, tdsAmount: 400, adminFee: 600 },
          _count: { id: 15 },
        })
        .mockResolvedValueOnce({
          _sum: { netAmount: 1200, grossAmount: 1500 },
          _count: { id: 3 },
        });

      const res = await service.getEarningsStats({ refresh: true });

      expect(res.totalMembershipEarnings).toBe(6000);
      expect(res.totalRepurchaseEarnings).toBe(3500);
      expect(res.totalEarnings).toBe(9500);
      expect(res.totalDistributed).toBe(7000);
      expect(res.totalGrossDistributed).toBe(8000);
      expect(res.totalTdsDeducted).toBe(400);
      expect(res.totalAdminFeeDeducted).toBe(600);
      expect(res.pendingDistributions).toBe(2700);
    });
  });

  describe('getBusinessStats', () => {
    it('should return combined repurchase, growth, and earnings summary', async () => {
      mockPrismaService.member.count
        .mockResolvedValueOnce(50)
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(30);

      mockPrismaService.member.groupBy.mockResolvedValueOnce([
        { status: MemberStatus.ACTIVE, _count: { id: 40 } },
      ]);

      mockPrismaService.$queryRaw.mockResolvedValueOnce([]);

      mockPrismaService.membershipCommissionLedger.groupBy.mockResolvedValueOnce([
        { status: CommissionStatus.DISBURSED, _sum: { amount: 2000 }, _count: { id: 4 } },
      ]);

      mockPrismaService.repurchaseCommissionLedger.groupBy.mockResolvedValueOnce([
        { status: CommissionStatus.DISBURSED, _sum: { amount: 1000 }, _count: { id: 2 } },
      ]);

      mockPrismaService.distributionRecord.aggregate
        .mockResolvedValueOnce({
          _sum: { netAmount: 2500, grossAmount: 3000, tdsAmount: 200, adminFee: 300 },
          _count: { id: 5 },
        })
        .mockResolvedValueOnce({
          _sum: { netAmount: 0, grossAmount: 0 },
          _count: { id: 0 },
        });

      mockPrismaService.repurchaseEntry.count.mockResolvedValueOnce(10);
      mockPrismaService.repurchaseEntry.aggregate
        .mockResolvedValueOnce({ _sum: { amount: 10000 } })
        .mockResolvedValueOnce({ _sum: { amount: 500 } })
        .mockResolvedValueOnce({ _sum: { amount: 2500 } })
        .mockResolvedValueOnce({ _sum: { amount: 8000 } });

      const res = await service.getBusinessStats({ refresh: true });

      expect(res.repurchaseSummary.totalOrders).toBe(10);
      expect(res.repurchaseSummary.totalVolume).toBe(10000);
      expect(res.repurchaseSummary.averageOrderValue).toBe(1000);
      expect(res.repurchaseSummary.todayVolume).toBe(500);

      expect(res.growthSummary.totalMembers).toBe(50);
      expect(res.growthSummary.activeMembers).toBe(40);
      expect(res.growthSummary.activationRate).toBe(80);

      expect(res.earningsSummary.totalEarnings).toBe(3000);
      expect(res.earningsSummary.totalDistributed).toBe(2500);
      expect(res.earningsSummary.payoutRatio).toBe(83.33);
    });
  });

  describe('getActivityFeed', () => {
    it('should return unified, most-recent-first paginated activity feed', async () => {
      const now = new Date();
      const tenMinsAgo = new Date(now.getTime() - 10 * 60 * 1000);
      const twentyMinsAgo = new Date(now.getTime() - 20 * 60 * 1000);
      const thirtyMinsAgo = new Date(now.getTime() - 30 * 60 * 1000);

      mockPrismaService.member.findMany.mockResolvedValueOnce([
        {
          id: 'm-100',
          memberCode: 'AK10100',
          name: 'Jane Doe',
          mobile: '+919876543210',
          role: 'MEMBER',
          status: 'ACTIVE',
          joiningDate: tenMinsAgo,
          referrer: { id: 'm-1', memberCode: 'AK10001', name: 'Sponsor' },
        },
      ]);

      mockPrismaService.repurchaseEntry.findMany.mockResolvedValueOnce([
        {
          id: 'rep-200',
          transactionRef: 'TXN-999',
          amount: 1500,
          transactionDate: now,
          remarks: 'Monthly repurchase',
          member: { id: 'm-100', memberCode: 'AK10100', name: 'Jane Doe', role: 'MEMBER' },
        },
      ]);

      mockPrismaService.distributionBatch.findMany.mockResolvedValueOnce([
        {
          id: 'batch-300',
          batchNo: 'BATCH-2026-001',
          totalMembers: 10,
          totalGrossAmount: 5000,
          totalNetAmount: 4500,
          status: 'COMPLETED',
          createdAt: twentyMinsAgo,
          completedAt: twentyMinsAgo,
          processor: { id: 'admin-1', memberCode: 'ADM001', name: 'Admin', role: 'ADMIN' },
        },
      ]);

      mockPrismaService.activityLog.findMany.mockResolvedValueOnce([
        {
          id: 'log-400',
          actionType: 'UPDATE_COMMISSION_CONFIG',
          entityType: 'MembershipCommissionConfig',
          entityId: 'cfg-1',
          actorRole: 'ADMIN',
          metadata: { version: 2 },
          createdAt: thirtyMinsAgo,
          actor: { id: 'admin-1', memberCode: 'ADM001', name: 'Admin', role: 'ADMIN' },
        },
      ]);

      const res = await service.getActivityFeed({ type: ActivityCategory.ALL, page: 1, limit: 10, refresh: true });

      expect(res.data.length).toBe(4);
      expect(res.meta.total).toBe(4);
      expect(res.meta.page).toBe(1);
      expect(res.meta.totalPages).toBe(1);

      // Most recent first: Repurchase (now) -> Member (10m ago) -> Distribution (20m ago) -> System (30m ago)
      expect(res.data[0].category).toBe(ActivityCategory.REPURCHASE);
      expect(res.data[1].category).toBe(ActivityCategory.MEMBER_REGISTRATION);
      expect(res.data[2].category).toBe(ActivityCategory.DISTRIBUTION);
      expect(res.data[3].category).toBe(ActivityCategory.SYSTEM_ACTIVITY);
    });
  });

  describe('getMemberPersonalDashboard', () => {
    it('should throw NotFoundException if member does not exist', async () => {
      mockPrismaService.member.findUnique.mockResolvedValueOnce(null);

      await expect(service.getMemberPersonalDashboard('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return member-scoped dashboard metrics', async () => {
      mockPrismaService.member.findUnique.mockResolvedValueOnce({
        id: 'mem-101',
        memberCode: 'AK10101',
        name: 'John Doe',
        email: 'john@example.com',
        mobile: '+919876543210',
        status: 'ACTIVE',
        role: 'MEMBER',
        joiningDate: new Date('2026-01-01'),
        referrer: { id: 'sponsor-1', memberCode: 'AK10001', name: 'Sponsor User' },
      });

      mockPrismaService.member.count
        .mockResolvedValueOnce(5)  // direct referrals total
        .mockResolvedValueOnce(4); // active direct referrals

      mockPrismaService.membershipCommissionLedger.groupBy.mockResolvedValueOnce([
        { status: CommissionStatus.DISBURSED, _sum: { amount: 1000 } },
        { status: CommissionStatus.PENDING, _sum: { amount: 250 } },
      ]);

      mockPrismaService.repurchaseCommissionLedger.groupBy.mockResolvedValueOnce([
        { status: CommissionStatus.DISBURSED, _sum: { amount: 500 } },
      ]);

      mockPrismaService.membershipCommissionLedger.findMany.mockResolvedValueOnce([
        {
          id: 'mled-1',
          amount: 100,
          level: 1,
          status: 'DISBURSED',
          createdAt: new Date('2026-08-14T08:00:00Z'),
          sourceMember: { id: 'm-2', memberCode: 'AK10002', name: 'Ref 1' },
        },
      ]);

      mockPrismaService.repurchaseCommissionLedger.findMany.mockResolvedValueOnce([]);

      mockPrismaService.$queryRaw.mockResolvedValueOnce([
        { id: 'm-1', status: 'ACTIVE' },
        { id: 'm-2', status: 'ACTIVE' },
        { id: 'm-3', status: 'INACTIVE' },
      ]);

      const res = await service.getMemberPersonalDashboard('mem-101', true);

      expect(res.memberInfo.memberCode).toBe('AK10101');
      expect(res.memberInfo.referrer?.name).toBe('Sponsor User');
      expect(res.referrals.totalDirectReferrals).toBe(5);
      expect(res.referrals.activeDirectReferrals).toBe(4);
      expect(res.referrals.totalDownlineMembers).toBe(3);
      expect(res.referrals.activeDownlineMembers).toBe(2);

      expect(res.earnings.membershipEarnings).toBe(1250);
      expect(res.earnings.repurchaseEarnings).toBe(500);
      expect(res.earnings.totalEarnings).toBe(1750);
      expect(res.earnings.totalDisbursed).toBe(1500);
      expect(res.earnings.totalPending).toBe(250);

      expect(res.recentCommissions.length).toBe(1);
    });
  });
});
