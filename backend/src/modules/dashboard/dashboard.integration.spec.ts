import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { DashboardCacheService } from './dashboard-cache.service';
import { PrismaService } from '../../prisma/prisma.service';
import { MemberStatus, CommissionStatus, DistributionRecordStatus } from '@prisma/client';

describe('Admin Dashboard Integration Test Suite', () => {
  let controller: DashboardController;
  let service: DashboardService;
  let cacheService: DashboardCacheService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      member: {
        count: jest.fn().mockImplementation(async ({ where }: any) => {
          if (where?.joiningDate?.gte) return 5;
          return 50;
        }),
        groupBy: jest.fn().mockResolvedValue([
          { status: MemberStatus.ACTIVE, _count: { id: 40 } },
          { status: MemberStatus.INACTIVE, _count: { id: 10 } },
        ]),
      },
      membershipCommissionLedger: {
        groupBy: jest.fn().mockResolvedValue([
          { status: CommissionStatus.DISBURSED, _sum: { amount: 5000 }, _count: { id: 10 } },
          { status: CommissionStatus.PENDING, _sum: { amount: 1000 }, _count: { id: 2 } },
        ]),
      },
      repurchaseCommissionLedger: {
        groupBy: jest.fn().mockResolvedValue([
          { status: CommissionStatus.DISBURSED, _sum: { amount: 3000 }, _count: { id: 6 } },
        ]),
      },
      distributionRecord: {
        aggregate: jest.fn().mockImplementation(async ({ where }: any) => {
          if (where?.status === DistributionRecordStatus.PAID) {
            return {
              _sum: { netAmount: 7000, grossAmount: 8000, tdsAmount: 400, adminFee: 600 },
              _count: { id: 12 },
            };
          }
          return {
            _sum: { netAmount: 1000, grossAmount: 1200 },
            _count: { id: 2 },
          };
        }),
      },
      repurchaseEntry: {
        count: jest.fn().mockResolvedValue(15),
        aggregate: jest.fn().mockResolvedValue({ _sum: { amount: 15000 } }),
      },
      $queryRaw: jest.fn().mockResolvedValue([
        { date: new Date('2026-08-14'), count: 5 },
      ]),
    };

    const mockConfigService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'REDIS_HOST') return 'localhost';
        if (key === 'REDIS_PORT') return 6379;
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        DashboardService,
        DashboardCacheService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    controller = module.get<DashboardController>(DashboardController);
    service = module.get<DashboardService>(DashboardService);
    cacheService = module.get<DashboardCacheService>(DashboardCacheService);

    await cacheService.clearDashboardCache();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  describe('1. GET /admin/dashboard/members', () => {
    it('should return member aggregation metrics and status breakdown', async () => {
      const res = await controller.getMemberStats({ refresh: true });

      expect(res).toBeDefined();
      expect(res.totalMembers).toBe(50);
      expect(res.joinedToday).toBe(5);
      expect(res.joinedThisWeek).toBe(5);
      expect(res.joinedThisMonth).toBe(5);
      expect(res.statusBreakdown.ACTIVE).toBe(40);
      expect(res.statusBreakdown.INACTIVE).toBe(10);
      expect(res.registrationTrend).toBeDefined();
    });
  });

  describe('2. GET /admin/dashboard/earnings', () => {
    it('should return earnings aggregation metrics for membership, repurchase, and payouts', async () => {
      const res = await controller.getEarningsStats({ refresh: true });

      expect(res).toBeDefined();
      expect(res.totalMembershipEarnings).toBe(6000);
      expect(res.totalRepurchaseEarnings).toBe(3000);
      expect(res.totalEarnings).toBe(9000);
      expect(res.totalDistributed).toBe(7000);
      expect(res.totalGrossDistributed).toBe(8000);
      expect(res.totalTdsDeducted).toBe(400);
      expect(res.totalAdminFeeDeducted).toBe(600);
      expect(res.pendingDistributions).toBe(2000); // 1000 pending membership ledger + 1000 pending distribution record
    });
  });

  describe('3. GET /admin/dashboard/business', () => {
    it('should return combined view of repurchase summary, growth summary, and earnings summary', async () => {
      const res = await controller.getBusinessStats({ refresh: true });

      expect(res).toBeDefined();
      expect(res.repurchaseSummary.totalOrders).toBe(15);
      expect(res.repurchaseSummary.totalVolume).toBe(15000);
      expect(res.repurchaseSummary.averageOrderValue).toBe(1000);

      expect(res.growthSummary.totalMembers).toBe(50);
      expect(res.growthSummary.activeMembers).toBe(40);
      expect(res.growthSummary.activationRate).toBe(80);

      expect(res.earningsSummary.totalEarnings).toBe(9000);
      expect(res.earningsSummary.totalDistributed).toBe(7000);
      expect(res.earningsSummary.payoutRatio).toBe(77.78);
    });
  });
});
