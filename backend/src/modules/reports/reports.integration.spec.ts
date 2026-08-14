import { Test, TestingModule } from '@nestjs/testing';
import { AdminEarningsMembershipController } from './admin-earnings-membership.controller';
import { MemberEarningsMembershipController } from './member-earnings-membership.controller';
import { ReportsService } from './reports.service';
import { MemberPortalReportsService } from './member-portal-reports.service';
import { PrismaService } from '../../prisma/prisma.service';
import { MemberRole, CommissionStatus } from '@prisma/client';

describe('Membership Earnings Reports Integration Test Suite', () => {
  let adminController: AdminEarningsMembershipController;
  let memberController: MemberEarningsMembershipController;
  let service: ReportsService;
  let prisma: any;

  const mockAdminUser = {
    id: 'admin-uuid-1',
    memberCode: 'ADM-0001',
    role: MemberRole.ADMIN,
  };

  const mockMemberUser = {
    id: 'member-uuid-1',
    memberCode: 'AK10001',
    name: 'John Member',
    role: MemberRole.MEMBER,
  };

  beforeEach(async () => {
    prisma = {
      member: {
        findUnique: jest.fn().mockImplementation(async ({ where }: any) => {
          if (where.id === mockMemberUser.id) return mockMemberUser;
          if (where.id === mockAdminUser.id) return mockAdminUser;
          return null;
        }),
        findMany: jest.fn().mockResolvedValue([mockMemberUser]),
      },
      membershipCommissionLedger: {
        count: jest.fn().mockResolvedValue(1),
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'ledger-uuid-1',
            beneficiaryMemberId: mockMemberUser.id,
            sourceMemberId: 'source-uuid-1',
            level: 1,
            percentage: 10,
            amount: 100,
            status: CommissionStatus.PENDING,
            createdAt: new Date('2026-08-01T10:00:00.000Z'),
            updatedAt: new Date('2026-08-01T10:00:00.000Z'),
            sourceMember: {
              id: 'source-uuid-1',
              memberCode: 'AK10002',
              name: 'Alice Source',
              mobile: '+919876543210',
            },
          },
        ]),
        groupBy: jest.fn().mockImplementation(async ({ by }: any) => {
          if (by.includes('beneficiaryMemberId')) {
            return [{ beneficiaryMemberId: mockMemberUser.id, _sum: { amount: 100 }, _count: { id: 1 } }];
          }
          if (by.includes('level')) {
            return [{ level: 1, _sum: { amount: 100 }, _count: { id: 1 } }];
          }
          return [{ status: CommissionStatus.PENDING, _sum: { amount: 100 }, _count: { id: 1 } }];
        }),
      },
      $queryRaw: jest.fn().mockResolvedValue([
        { date: new Date('2026-08-01'), count: 1, amount: 100 },
      ]),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminEarningsMembershipController, MemberEarningsMembershipController],
      providers: [
        ReportsService,
        MemberPortalReportsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    adminController = module.get<AdminEarningsMembershipController>(AdminEarningsMembershipController);
    memberController = module.get<MemberEarningsMembershipController>(MemberEarningsMembershipController);
    service = module.get<ReportsService>(ReportsService);
  });

  it('should be defined', () => {
    expect(adminController).toBeDefined();
    expect(memberController).toBeDefined();
    expect(service).toBeDefined();
  });

  describe('1. GET /admin/earnings/membership', () => {
    it('should return admin membership earnings report with summary totals', async () => {
      const result = await adminController.getEarningsList({});

      expect(result).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.summary.totalGrossAmount).toBe(100);
      expect(result.summary.pendingAmount).toBe(100);
      expect(result.data.length).toBe(1);
    });
  });

  describe('2. GET /admin/earnings/membership/level-wise', () => {
    it('should return aggregated membership earnings by level', async () => {
      const result = await adminController.getLevelWiseEarnings({});

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(20);
    });
  });

  describe('3. GET /admin/earnings/membership/member-wise', () => {
    it('should return member-wise aggregated earnings', async () => {
      const result = await adminController.getMemberWiseEarnings({});

      expect(result).toBeDefined();
      expect(result.data.length).toBe(1);
      expect(result.data[0].member).toBeDefined();
      expect(result.data[0].totalEarned).toBe(100);
    });
  });

  describe('4. GET /member/earnings/membership', () => {
    it('should return member earnings scoped strictly to logged-in user JWT ID', async () => {
      const result = await memberController.getMyMembershipEarnings(mockMemberUser.id, {});

      expect(result).toBeDefined();
      expect(result.summary.totalEarned).toBe(100);
    });
  });
});
