import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { HierarchyService } from './hierarchy.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NetworkGrowthGroupBy } from './dto/network-growth-query.dto';

describe('HierarchyService (Recursive CTE Traversal & Network Analytics)', () => {
  let service: HierarchyService;
  let prisma: any;

  const mockRootMember = { id: 'root-member-uuid', memberCode: 'AK10000', name: 'Root Member' };

  const mockDownlineNodes = [
    {
      id: 'level-1-child',
      memberCode: 'AK10002',
      name: 'Level 1 Referral',
      mobile: '+919999999991',
      email: 'child1@example.com',
      referrerId: 'root-member-uuid',
      joiningDate: new Date('2026-08-01T10:00:00Z'),
      status: 'ACTIVE',
      role: 'MEMBER',
      level: 1,
    },
    {
      id: 'level-2-grandchild',
      memberCode: 'AK10003',
      name: 'Level 2 Referral',
      mobile: '+919999999992',
      email: 'grandchild@example.com',
      referrerId: 'level-1-child',
      joiningDate: new Date('2026-08-05T10:00:00Z'),
      status: 'ACTIVE',
      role: 'MEMBER',
      level: 2,
    },
  ];

  const mockUplineNodes = [
    {
      id: 'level-1-referrer',
      memberCode: 'AK10001',
      name: 'Direct Sponsor',
      mobile: '+919999999990',
      email: 'sponsor@example.com',
      referrerId: 'root-member-uuid',
      joiningDate: new Date(),
      status: 'ACTIVE',
      role: 'MEMBER',
      level: 1,
    },
    {
      id: 'root-member-uuid',
      memberCode: 'AK10000',
      name: 'Root Sponsor',
      mobile: '+919999999989',
      email: 'root@example.com',
      referrerId: null,
      joiningDate: new Date(),
      status: 'ACTIVE',
      role: 'ADMIN',
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
      providers: [
        HierarchyService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<HierarchyService>(HierarchyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getDownline', () => {
    it('should fetch recursive downline nodes up to parameterized levels', async () => {
      prisma.member.findUnique.mockResolvedValue(mockRootMember);
      prisma.$queryRaw.mockResolvedValue(mockDownlineNodes);

      const result = await service.getDownline(mockRootMember.id, 5);

      expect(prisma.member.findUnique).toHaveBeenCalledWith({
        where: { id: mockRootMember.id },
        select: { id: true },
      });

      expect(prisma.$queryRaw).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0].level).toEqual(1);
      expect(result[1].level).toEqual(2);
    });

    it('should throw NotFoundException if target member does not exist', async () => {
      prisma.member.findUnique.mockResolvedValue(null);

      await expect(service.getDownline('non-existent-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getUpline', () => {
    it('should fetch recursive upline nodes up to root sponsor', async () => {
      prisma.member.findUnique.mockResolvedValue({ id: 'level-2-child-uuid' });
      prisma.$queryRaw.mockResolvedValue(mockUplineNodes);

      const result = await service.getUpline('level-2-child-uuid', 20);

      expect(prisma.member.findUnique).toHaveBeenCalledWith({
        where: { id: 'level-2-child-uuid' },
        select: { id: true },
      });

      expect(prisma.$queryRaw).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0].name).toEqual('Direct Sponsor');
      expect(result[1].name).toEqual('Root Sponsor');
    });

    it('should throw NotFoundException if member does not exist', async () => {
      prisma.member.findUnique.mockResolvedValue(null);

      await expect(service.getUpline('non-existent-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('searchDownline', () => {
    it('should search downline nodes matching search string q', async () => {
      prisma.member.findUnique.mockResolvedValue(mockRootMember);
      prisma.$queryRaw.mockResolvedValue([mockDownlineNodes[0]]);

      const result = await service.searchDownline(mockRootMember.id, { q: 'Level 1' });

      expect(prisma.$queryRaw).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].name).toEqual('Level 1 Referral');
    });

    it('should throw NotFoundException if target member for search does not exist', async () => {
      prisma.member.findUnique.mockResolvedValue(null);

      await expect(
        service.searchDownline('non-existent-uuid', { q: 'test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getNetworkGrowth', () => {
    it('should aggregate network growth by month and level', async () => {
      prisma.member.findUnique.mockResolvedValue(mockRootMember);
      prisma.$queryRaw.mockResolvedValue(mockDownlineNodes);

      const result = await service.getNetworkGrowth(mockRootMember.id, {
        groupBy: NetworkGrowthGroupBy.MONTH,
      });

      expect(result).toHaveLength(2);
      expect(result[0].period).toEqual('2026-08');
      expect(result[0].level).toEqual(1);
      expect(result[0].joinCount).toEqual(1);
    });

    it('should filter growth by date range when startDate and endDate are provided', async () => {
      prisma.member.findUnique.mockResolvedValue(mockRootMember);
      prisma.$queryRaw.mockResolvedValue(mockDownlineNodes);

      const result = await service.getNetworkGrowth(mockRootMember.id, {
        groupBy: NetworkGrowthGroupBy.MONTH,
        startDate: '2026-08-04T00:00:00.000Z',
        endDate: '2026-08-10T23:59:59.999Z',
      });

      expect(result).toHaveLength(1);
      expect(result[0].level).toEqual(2);
    });
  });

  describe('getBranchCounts & getHierarchySummary', () => {
    it('should compute branch counts for direct referral legs', async () => {
      prisma.member.findUnique.mockResolvedValue(mockRootMember);
      prisma.member.findMany.mockResolvedValue([
        {
          id: 'level-1-child',
          memberCode: 'AK10002',
          name: 'Level 1 Referral',
          status: 'ACTIVE',
        },
      ]);
      prisma.$queryRaw.mockResolvedValue([mockDownlineNodes[1]]); // sub-downline under leg

      const result = await service.getBranchCounts(mockRootMember.id);

      expect(result).toHaveLength(1);
      expect(result[0].branchRootId).toEqual('level-1-child');
      expect(result[0].totalDownlineInBranch).toEqual(2);
      expect(result[0].activeMembersInBranch).toEqual(2);
    });

    it('should return complete hierarchy summary with metrics and level breakdown', async () => {
      prisma.member.findUnique.mockResolvedValue(mockRootMember);
      prisma.member.findMany.mockResolvedValue([
        {
          id: 'level-1-child',
          memberCode: 'AK10002',
          name: 'Level 1 Referral',
          status: 'ACTIVE',
        },
      ]);
      prisma.$queryRaw.mockResolvedValue(mockDownlineNodes);

      const summary = await service.getHierarchySummary(mockRootMember.id);

      expect(summary.memberId).toEqual(mockRootMember.id);
      expect(summary.totalDownline).toEqual(2);
      expect(summary.activeDownline).toEqual(2);
      expect(summary.levelBreakdown).toHaveLength(2);
    });
  });

  describe('isMemberInDownline', () => {
    it('should return true if targetMemberId is same as rootMemberId', async () => {
      const result = await service.isMemberInDownline('user-1', 'user-1');
      expect(result).toBe(true);
    });

    it('should return true if rootMemberId is found in target member upline chain', async () => {
      prisma.member.findUnique.mockResolvedValue({ id: 'level-2-grandchild' });
      prisma.$queryRaw.mockResolvedValue(mockUplineNodes); // upline contains root-member-uuid

      const result = await service.isMemberInDownline('root-member-uuid', 'level-2-grandchild');
      expect(result).toBe(true);
    });

    it('should return false if rootMemberId is not in target member upline chain', async () => {
      prisma.member.findUnique.mockResolvedValue({ id: 'stranger' });
      prisma.$queryRaw.mockResolvedValue(mockUplineNodes);

      const result = await service.isMemberInDownline('other-root', 'stranger');
      expect(result).toBe(false);
    });
  });
});
