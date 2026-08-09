import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { HierarchyController } from './hierarchy.controller';
import { HierarchyService } from './hierarchy.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NetworkGrowthGroupBy } from './dto/network-growth-query.dto';

describe('Hierarchy Module Integration Suite', () => {
  let controller: HierarchyController;
  let service: HierarchyService;
  let prisma: any;

  const mockRootMember = {
    id: 'root-uuid-100',
    memberCode: 'AK10000',
    name: 'Root Admin Sponsor',
  };

  const mockDownlineNodes = [
    {
      id: 'downline-uuid-101',
      memberCode: 'AK10001',
      name: 'Alice Johnson',
      mobile: '+919876543210',
      email: 'alice@example.com',
      referrerId: 'root-uuid-100',
      joiningDate: new Date('2026-08-01T09:00:00.000Z'),
      status: 'ACTIVE',
      role: 'MEMBER',
      level: 1,
    },
    {
      id: 'downline-uuid-102',
      memberCode: 'AK10002',
      name: 'Bob Smith',
      mobile: '+919876543211',
      email: 'bob@example.com',
      referrerId: 'downline-uuid-101',
      joiningDate: new Date('2026-08-05T14:30:00.000Z'),
      status: 'ACTIVE',
      role: 'MEMBER',
      level: 2,
    },
    {
      id: 'downline-uuid-103',
      memberCode: 'AK10003',
      name: 'Charlie Brown',
      mobile: '+919876543212',
      email: 'charlie@example.com',
      referrerId: 'downline-uuid-101',
      joiningDate: new Date('2026-08-10T11:15:00.000Z'),
      status: 'INACTIVE',
      role: 'MEMBER',
      level: 2,
    },
  ];

  beforeEach(async () => {
    prisma = {
      member: {
        findUnique: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
      },
      $queryRaw: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HierarchyController],
      providers: [
        HierarchyService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    controller = module.get<HierarchyController>(HierarchyController);
    service = module.get<HierarchyService>(HierarchyService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  describe('1. Search-in-downline Integration', () => {
    it('should search downline for matching memberCode or name via controller endpoint', async () => {
      prisma.member.findUnique.mockResolvedValue(mockRootMember);
      prisma.$queryRaw.mockResolvedValue([mockDownlineNodes[0]]);

      const result = await controller.searchDownline(mockRootMember.id, {
        q: 'Alice',
        maxLevels: 20,
      });

      expect(prisma.member.findUnique).toHaveBeenCalledWith({
        where: { id: mockRootMember.id },
        select: { id: true },
      });
      expect(prisma.$queryRaw).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].name).toEqual('Alice Johnson');
      expect(result[0].memberCode).toEqual('AK10001');
    });

    it('should throw NotFoundException if root member for search does not exist', async () => {
      prisma.member.findUnique.mockResolvedValue(null);

      await expect(
        controller.searchDownline('non-existent-id', { q: 'Alice' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('2. Network Growth Analytics Integration', () => {
    it('should calculate monthly network growth points across level depth', async () => {
      prisma.member.findUnique.mockResolvedValue(mockRootMember);
      prisma.$queryRaw.mockResolvedValue(mockDownlineNodes);

      const result = await controller.getNetworkGrowth(mockRootMember.id, {
        groupBy: NetworkGrowthGroupBy.MONTH,
        maxLevels: 20,
      });

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('period');
      expect(result[0]).toHaveProperty('level');
      expect(result[0]).toHaveProperty('joinCount');
    });

    it('should support weekly network growth breakdown with date range filters', async () => {
      prisma.member.findUnique.mockResolvedValue(mockRootMember);
      prisma.$queryRaw.mockResolvedValue(mockDownlineNodes);

      const result = await controller.getNetworkGrowth(mockRootMember.id, {
        groupBy: NetworkGrowthGroupBy.WEEK,
        startDate: '2026-08-01T00:00:00.000Z',
        endDate: '2026-08-07T23:59:59.999Z',
      });

      expect(result).toBeDefined();
      // Should filter to nodes within 1st week of August
      expect(result.every((point) => point.joinCount > 0)).toBe(true);
    });
  });

  describe('3. Branch Counts & Hierarchy Summary Integration', () => {
    it('should calculate branch leg downline counts and return summary object', async () => {
      prisma.member.findUnique.mockResolvedValue(mockRootMember);
      prisma.member.findMany.mockResolvedValue([
        {
          id: 'downline-uuid-101',
          memberCode: 'AK10001',
          name: 'Alice Johnson',
          status: 'ACTIVE',
        },
      ]);
      prisma.$queryRaw.mockResolvedValue(mockDownlineNodes.slice(1)); // sub-downline under Alice

      const summary = await controller.getHierarchySummary(mockRootMember.id, { maxLevels: 20 });

      expect(summary.memberId).toEqual(mockRootMember.id);
      expect(summary.memberName).toEqual('Root Admin Sponsor');
      expect(summary.totalBranches).toEqual(1);
      expect(summary.branches[0].branchRootId).toEqual('downline-uuid-101');
      expect(summary.branches[0].totalDownlineInBranch).toEqual(3); // Alice + 2 downline nodes
    });
  });

  describe('4. Section 8.3 Access Restriction (isInDownlineOf) Integration', () => {
    it('should return true for downline members and false for non-downline members', async () => {
      prisma.member.findUnique.mockResolvedValue({ id: 'downline-uuid-102' });
      prisma.$queryRaw.mockResolvedValue([
        { id: 'downline-uuid-101', referrerId: 'root-uuid-100' },
        { id: 'root-uuid-100', referrerId: null },
      ]);

      const isDownline = await service.isInDownlineOf('root-uuid-100', 'downline-uuid-102');
      expect(isDownline).toBe(true);

      const isNotDownline = await service.isInDownlineOf('other-user-uuid', 'downline-uuid-102');
      expect(isNotDownline).toBe(false);
    });
  });
});
