import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MemberDashboardController } from './member-dashboard.controller';
import { DashboardService } from './dashboard.service';
import { DashboardCacheService } from './dashboard-cache.service';
import { PrismaService } from '../../prisma/prisma.service';
import { MemberStatus, CommissionStatus } from '@prisma/client';

describe('MemberDashboardController Integration Test Suite', () => {
  let controller: MemberDashboardController;
  let service: DashboardService;
  let cacheService: DashboardCacheService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      member: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'mem-jwt-100',
          memberCode: 'AK10100',
          name: 'Personal Member',
          email: 'personal@member.com',
          mobile: '+919123456789',
          status: MemberStatus.ACTIVE,
          role: 'MEMBER',
          joiningDate: new Date('2026-02-01T00:00:00Z'),
          referrer: {
            id: 'ref-1',
            memberCode: 'AK10001',
            name: 'Direct Sponsor',
          },
        }),
        count: jest.fn().mockImplementation(async ({ where }: any) => {
          if (
            where?.referrerId === 'mem-jwt-100' &&
            where?.status === MemberStatus.ACTIVE
          )
            return 3;
          if (where?.referrerId === 'mem-jwt-100') return 4;
          return 0;
        }),
      },
      membershipCommissionLedger: {
        groupBy: jest.fn().mockResolvedValue([
          { status: CommissionStatus.DISBURSED, _sum: { amount: 2000 } },
          { status: CommissionStatus.PENDING, _sum: { amount: 500 } },
        ]),
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'm-comm-1',
            amount: 500,
            level: 1,
            status: CommissionStatus.DISBURSED,
            createdAt: new Date('2026-08-14T09:00:00Z'),
            sourceMember: {
              id: 'm-2',
              memberCode: 'AK10002',
              name: 'Downline Ref',
            },
          },
        ]),
      },
      repurchaseCommissionLedger: {
        groupBy: jest
          .fn()
          .mockResolvedValue([
            { status: CommissionStatus.DISBURSED, _sum: { amount: 800 } },
          ]),
        findMany: jest.fn().mockResolvedValue([]),
      },
      $queryRaw: jest.fn().mockResolvedValue([
        { id: 'sub-1', status: 'ACTIVE' },
        { id: 'sub-2', status: 'ACTIVE' },
        { id: 'sub-3', status: 'ACTIVE' },
        { id: 'sub-4', status: 'INACTIVE' },
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
      controllers: [MemberDashboardController],
      providers: [
        DashboardService,
        DashboardCacheService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    controller = module.get<MemberDashboardController>(
      MemberDashboardController,
    );
    service = module.get<DashboardService>(DashboardService);
    cacheService = module.get<DashboardCacheService>(DashboardCacheService);

    await cacheService.clearDashboardCache();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  describe('GET /member/dashboard', () => {
    it('should return member personal dashboard strictly derived from JWT memberId', async () => {
      const loggedInMemberId = 'mem-jwt-100';
      const res = await controller.getMemberDashboard(loggedInMemberId, true);

      expect(res).toBeDefined();
      expect(res.memberInfo.id).toBe(loggedInMemberId);
      expect(res.memberInfo.memberCode).toBe('AK10100');
      expect(res.memberInfo.name).toBe('Personal Member');
      expect(res.memberInfo.referrer?.name).toBe('Direct Sponsor');

      expect(res.referrals.totalDirectReferrals).toBe(4);
      expect(res.referrals.activeDirectReferrals).toBe(3);
      expect(res.referrals.totalDownlineMembers).toBe(4);
      expect(res.referrals.activeDownlineMembers).toBe(3);

      expect(res.earnings.membershipEarnings).toBe(2500);
      expect(res.earnings.repurchaseEarnings).toBe(800);
      expect(res.earnings.totalEarnings).toBe(3300);
      expect(res.earnings.totalDisbursed).toBe(2800);
      expect(res.earnings.totalPending).toBe(500);

      expect(res.recentCommissions.length).toBe(1);
    });
  });
});
