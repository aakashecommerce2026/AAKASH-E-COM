import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { DashboardService } from './dashboard.service';
import { DashboardCacheService } from './dashboard-cache.service';
import { PrismaService } from '../../prisma/prisma.service';
import { MemberStatus, CommissionStatus, DistributionRecordStatus } from '@prisma/client';

describe('DashboardService', () => {
  let service: DashboardService;
  let cacheService: DashboardCacheService;
  let prisma: PrismaService;

  const mockPrismaService = {
    member: {
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    membershipCommissionLedger: {
      groupBy: jest.fn(),
    },
    repurchaseCommissionLedger: {
      groupBy: jest.fn(),
    },
    distributionRecord: {
      aggregate: jest.fn(),
    },
    repurchaseEntry: {
      count: jest.fn(),
      aggregate: jest.fn(),
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
        }) // disbursed records (PAID)
        .mockResolvedValueOnce({
          _sum: { netAmount: 1200, grossAmount: 1500 },
          _count: { id: 3 },
        }); // pending records

      const res = await service.getEarningsStats({ refresh: true });

      expect(res.totalMembershipEarnings).toBe(6000);
      expect(res.totalRepurchaseEarnings).toBe(3500);
      expect(res.totalEarnings).toBe(9500);
      expect(res.totalDistributed).toBe(7000);
      expect(res.totalGrossDistributed).toBe(8000);
      expect(res.totalTdsDeducted).toBe(400);
      expect(res.totalAdminFeeDeducted).toBe(600);
      // Pending = (1000 membership pending + 500 repurchase pending) + 1200 pending records = 2700
      expect(res.pendingDistributions).toBe(2700);
    });
  });

  describe('getBusinessStats', () => {
    it('should return combined repurchase, growth, and earnings summary', async () => {
      // Mock member stats & earnings stats via internal methods or prisma
      mockPrismaService.member.count
        .mockResolvedValueOnce(50) // total
        .mockResolvedValueOnce(2)  // today
        .mockResolvedValueOnce(10) // week
        .mockResolvedValueOnce(30); // month

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
        .mockResolvedValueOnce({ _sum: { amount: 10000 } }) // total volume
        .mockResolvedValueOnce({ _sum: { amount: 500 } })   // today volume
        .mockResolvedValueOnce({ _sum: { amount: 2500 } })  // week volume
        .mockResolvedValueOnce({ _sum: { amount: 8000 } }); // month volume

      const res = await service.getBusinessStats({ refresh: true });

      expect(res.repurchaseSummary.totalOrders).toBe(10);
      expect(res.repurchaseSummary.totalVolume).toBe(10000);
      expect(res.repurchaseSummary.averageOrderValue).toBe(1000);
      expect(res.repurchaseSummary.todayVolume).toBe(500);

      expect(res.growthSummary.totalMembers).toBe(50);
      expect(res.growthSummary.activeMembers).toBe(40);
      expect(res.growthSummary.activationRate).toBe(80); // (40/50)*100

      expect(res.earningsSummary.totalEarnings).toBe(3000);
      expect(res.earningsSummary.totalDistributed).toBe(2500);
      expect(res.earningsSummary.payoutRatio).toBe(83.33);
    });
  });
});
