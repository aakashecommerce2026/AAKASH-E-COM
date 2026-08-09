import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { HierarchyService } from './hierarchy.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('HierarchyService (Recursive CTE Traversal)', () => {
  let service: HierarchyService;
  let prisma: any;

  const mockRootMember = { id: 'root-member-uuid' };

  const mockDownlineNodes = [
    {
      id: 'level-1-child',
      memberCode: 'AK10002',
      name: 'Level 1 Referral',
      mobile: '+919999999991',
      email: 'child1@example.com',
      referrerId: 'root-member-uuid',
      joiningDate: new Date(),
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
      joiningDate: new Date(),
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
});
