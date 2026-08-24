import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CommissionStatus } from '@prisma/client';

describe('ReportsService Unit Tests', () => {
  let service: ReportsService;
  let prisma: any;

  const mockMember1 = {
    id: 'm-uuid-1',
    memberCode: 'AK10001',
    name: 'Member One',
    mobile: '+919999999991',
    email: 'm1@example.com',
    status: 'ACTIVE',
  };

  const mockMember2 = {
    id: 'm-uuid-2',
    memberCode: 'AK10002',
    name: 'Member Two',
    mobile: '+919999999992',
    email: 'm2@example.com',
    status: 'ACTIVE',
  };

  const mockLedgers = [
    {
      id: 'led-1',
      sourceMemberId: mockMember1.id,
      sourceMember: mockMember1,
      beneficiaryMemberId: mockMember2.id,
      beneficiaryMember: mockMember2,
      level: 1,
      percentage: 10.0,
      amount: 100.0,
      status: CommissionStatus.PENDING,
      createdAt: new Date('2026-02-01T10:00:00Z'),
      updatedAt: new Date('2026-02-01T10:00:00Z'),
    },
    {
      id: 'led-2',
      sourceMemberId: mockMember1.id,
      sourceMember: mockMember1,
      beneficiaryMemberId: mockMember2.id,
      beneficiaryMember: mockMember2,
      level: 2,
      percentage: 5.0,
      amount: 50.0,
      status: CommissionStatus.HOLD,
      createdAt: new Date('2026-02-02T10:00:00Z'),
      updatedAt: new Date('2026-02-02T10:00:00Z'),
    },
  ];

  beforeEach(async () => {
    prisma = {
      member: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
      membershipCommissionLedger: {
        count: jest.fn(),
        findMany: jest.fn(),
        groupBy: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [ReportsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('1. getAdminMembershipEarnings', () => {
    it('should return paginated admin membership earnings list and summary totals', async () => {
      prisma.membershipCommissionLedger.count.mockResolvedValue(2);
      prisma.membershipCommissionLedger.findMany.mockResolvedValue(mockLedgers);
      prisma.membershipCommissionLedger.groupBy.mockResolvedValue([
        {
          status: CommissionStatus.PENDING,
          _sum: { amount: 100 },
          _count: { id: 1 },
        },
        {
          status: CommissionStatus.HOLD,
          _sum: { amount: 50 },
          _count: { id: 1 },
        },
      ]);

      const result = await service.getAdminMembershipEarnings({
        startDate: '2026-02-01',
        endDate: '2026-02-28',
        page: 1,
        limit: 10,
      });

      expect(result.data.length).toBe(2);
      expect(result.meta.total).toBe(2);
      expect(result.summary).toEqual({
        totalGrossAmount: 150,
        pendingAmount: 100,
        holdAmount: 50,
        disbursedAmount: 0,
        cancelledAmount: 0,
      });
    });

    it('should filter by level, status, and specific memberId', async () => {
      prisma.membershipCommissionLedger.count.mockResolvedValue(1);
      prisma.membershipCommissionLedger.findMany.mockResolvedValue([
        mockLedgers[0],
      ]);
      prisma.membershipCommissionLedger.groupBy.mockResolvedValue([
        {
          status: CommissionStatus.PENDING,
          _sum: { amount: 100 },
          _count: { id: 1 },
        },
      ]);

      const result = await service.getAdminMembershipEarnings({
        level: 1,
        status: CommissionStatus.PENDING,
        memberId: mockMember2.id,
      });

      expect(result.data.length).toBe(1);
      expect(result.summary.pendingAmount).toBe(100);
      expect(prisma.membershipCommissionLedger.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            level: 1,
            status: CommissionStatus.PENDING,
            OR: [
              { sourceMemberId: mockMember2.id },
              { beneficiaryMemberId: mockMember2.id },
            ],
          }),
        }),
      );
    });
  });

  describe('2. getLevelWiseEarnings', () => {
    it('should return aggregated earnings table for all 20 levels', async () => {
      prisma.membershipCommissionLedger.groupBy
        .mockResolvedValueOnce([
          { level: 1, _sum: { amount: 200 }, _count: { id: 2 } },
          { level: 2, _sum: { amount: 50 }, _count: { id: 1 } },
        ])
        .mockResolvedValueOnce([
          { level: 1, status: CommissionStatus.PENDING, _sum: { amount: 200 } },
          { level: 2, status: CommissionStatus.HOLD, _sum: { amount: 50 } },
        ]);

      const result = await service.getLevelWiseEarnings({
        startDate: '2026-01-01',
      });

      expect(result.length).toBe(20);
      expect(result[0]).toEqual({
        level: 1,
        totalAmount: 200,
        totalCount: 2,
        pendingAmount: 200,
        holdAmount: 0,
        disbursedAmount: 0,
        cancelledAmount: 0,
      });
      expect(result[1]).toEqual({
        level: 2,
        totalAmount: 50,
        totalCount: 1,
        pendingAmount: 0,
        holdAmount: 50,
        disbursedAmount: 0,
        cancelledAmount: 0,
      });
      expect(result[19].level).toBe(20);
      expect(result[19].totalAmount).toBe(0);
    });
  });

  describe('3. getMemberWiseEarnings', () => {
    it('should return aggregated earnings grouped by beneficiary member', async () => {
      prisma.membershipCommissionLedger.groupBy
        .mockResolvedValueOnce([
          {
            beneficiaryMemberId: mockMember2.id,
            _sum: { amount: 150 },
            _count: { id: 2 },
          },
        ])
        .mockResolvedValueOnce([
          {
            beneficiaryMemberId: mockMember2.id,
            status: CommissionStatus.PENDING,
            _sum: { amount: 100 },
          },
          {
            beneficiaryMemberId: mockMember2.id,
            status: CommissionStatus.HOLD,
            _sum: { amount: 50 },
          },
        ]);

      prisma.member.findMany.mockResolvedValue([mockMember2]);

      const result = await service.getMemberWiseEarnings({
        page: 1,
        limit: 10,
      });

      expect(result.data.length).toBe(1);
      expect(result.data[0].member.id).toBe(mockMember2.id);
      expect(result.data[0].totalEarned).toBe(150);
      expect(result.data[0].pendingAmount).toBe(100);
      expect(result.data[0].holdAmount).toBe(50);
      expect(result.meta.total).toBe(1);
    });

    it('should return empty result if no beneficiary members match search', async () => {
      prisma.membershipCommissionLedger.groupBy.mockResolvedValue([]);

      const result = await service.getMemberWiseEarnings({
        search: 'NonExistent',
      });

      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
    });
  });

  describe('4. getMemberEarnings (Logged-in Member Scoped)', () => {
    it('should return member self-service earnings scoped to JWT user ID', async () => {
      prisma.member.findUnique.mockResolvedValue(mockMember2);
      prisma.membershipCommissionLedger.count.mockResolvedValue(2);
      prisma.membershipCommissionLedger.findMany.mockResolvedValue(mockLedgers);
      prisma.membershipCommissionLedger.groupBy.mockResolvedValue([
        {
          status: CommissionStatus.PENDING,
          _sum: { amount: 100 },
          _count: { id: 1 },
        },
        {
          status: CommissionStatus.HOLD,
          _sum: { amount: 50 },
          _count: { id: 1 },
        },
      ]);

      const result = await service.getMemberEarnings(mockMember2.id, {
        page: 1,
        limit: 10,
      });

      expect(result.data.length).toBe(2);
      expect(result.summary).toEqual({
        totalEarned: 150,
        pendingAmount: 100,
        holdAmount: 50,
        disbursedAmount: 0,
        cancelledAmount: 0,
      });
      expect(prisma.membershipCommissionLedger.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            beneficiaryMemberId: mockMember2.id,
          }),
        }),
      );
    });

    it('should throw NotFoundException if member account does not exist', async () => {
      prisma.member.findUnique.mockResolvedValue(null);

      await expect(
        service.getMemberEarnings('non-existent-user', {}),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
