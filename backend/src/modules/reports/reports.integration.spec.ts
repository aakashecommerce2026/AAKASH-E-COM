import { Test, TestingModule } from '@nestjs/testing';
import { AdminEarningsMembershipController } from './admin-earnings-membership.controller';
import { MemberEarningsMembershipController } from './member-earnings-membership.controller';
import { ReportsService } from './reports.service';
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
            id: 'led-uuid-100',
            sourceMemberId: 'source-1',
            beneficiaryMemberId: mockMemberUser.id,
            level: 1,
            percentage: 10,
            amount: 100,
            status: CommissionStatus.PENDING,
            createdAt: new Date(),
            updatedAt: new Date(),
            sourceMember: { id: 'source-1', memberCode: 'AK10000', name: 'Sponsor', mobile: '+919999999999' },
            beneficiaryMember: mockMemberUser,
          },
        ]),
        groupBy: jest.fn().mockImplementation(async ({ by }: any) => {
          if (by.includes('level')) {
            return [{ level: 1, _sum: { amount: 100 }, _count: { id: 1 } }];
          }
          if (by.includes('beneficiaryMemberId')) {
            return [{ beneficiaryMemberId: mockMemberUser.id, _sum: { amount: 100 }, _count: { id: 1 } }];
          }
          return [{ status: CommissionStatus.PENDING, _sum: { amount: 100 }, _count: { id: 1 } }];
        }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminEarningsMembershipController, MemberEarningsMembershipController],
      providers: [
        ReportsService,
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
    it('should return earnings list and summary totals', async () => {
      const res = await adminController.getEarningsList({ page: 1, limit: 10 });

      expect(res.data.length).toBe(1);
      expect(res.meta.total).toBe(1);
      expect(res.summary.totalGrossAmount).toBe(100);
      expect(res.summary.pendingAmount).toBe(100);
    });
  });

  describe('2. GET /admin/earnings/membership/level-wise', () => {
    it('should return level-wise aggregation table for 20 levels', async () => {
      const res = await adminController.getLevelWiseEarnings({});

      expect(res.length).toBe(20);
      expect(res[0].level).toBe(1);
      expect(res[0].totalAmount).toBe(100);
    });
  });

  describe('3. GET /admin/earnings/membership/member-wise', () => {
    it('should return member-wise aggregated earnings', async () => {
      const res = await adminController.getMemberWiseEarnings({ page: 1, limit: 10 });

      expect(res.data.length).toBe(1);
      expect(res.data[0].member.id).toBe(mockMemberUser.id);
      expect(res.data[0].totalEarned).toBe(100);
    });
  });

  describe('4. GET /member/earnings/membership', () => {
    it('should return member earnings scoped strictly to logged-in user JWT ID', async () => {
      const res = await memberController.getMyMembershipEarnings(mockMemberUser.id, { page: 1, limit: 10 });

      expect(res.data.length).toBe(1);
      expect(res.data[0].beneficiaryMemberId).toBe(mockMemberUser.id);
      expect(res.summary.totalEarned).toBe(100);
    });
  });
});
