import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { MembersService } from './members.service';
import { PrismaService } from '../../prisma/prisma.service';
import { MemberRole, MemberStatus } from '@prisma/client';

describe('MembersService', () => {
  let service: MembersService;
  let prisma: any;

  const mockActiveReferrer = {
    id: 'referrer-uuid-1',
    memberCode: 'AK10001',
    name: 'Active Referrer',
    mobile: '+919999999999',
    status: MemberStatus.ACTIVE,
  };

  const mockInactiveReferrer = {
    id: 'referrer-uuid-2',
    memberCode: 'AK10002',
    name: 'Blocked Referrer',
    mobile: '+918888888888',
    status: MemberStatus.BLOCKED,
  };

  const mockMember = {
    id: 'member-uuid-1',
    memberCode: 'AK10003',
    name: 'New Member',
    mobile: '+917777777777',
    email: 'new@example.com',
    status: MemberStatus.ACTIVE,
    role: MemberRole.MEMBER,
    passwordHash: 'hashed_password',
    referrerId: mockActiveReferrer.id,
  };

  beforeEach(async () => {
    prisma = {
      member: {
        count: jest.fn().mockResolvedValue(10),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MembersService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<MembersService>(MembersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createByAdmin', () => {
    it('should create member with auto-generated code and temp password if missing, validating active referrer', async () => {
      prisma.member.findFirst.mockResolvedValue(null);
      prisma.member.findUnique
        .mockResolvedValueOnce(null) // for code collision check
        .mockResolvedValueOnce(mockActiveReferrer); // for referrer check
      prisma.member.create.mockResolvedValue({
        ...mockMember,
        referrerId: mockActiveReferrer.id,
      });

      const result = await service.createByAdmin({
        name: 'New Member',
        mobile: '+917777777777',
        referrerId: mockActiveReferrer.id,
      });

      expect(result).toHaveProperty('memberCode');
      expect(result).toHaveProperty('tempPassword');
      expect(result.id).toEqual(mockMember.id);
    });

    it('should throw BadRequestException if referrer is not ACTIVE', async () => {
      prisma.member.findFirst.mockResolvedValue(null);
      prisma.member.findUnique.mockResolvedValue(mockInactiveReferrer);

      await expect(
        service.createByAdmin({
          name: 'New Member',
          mobile: '+917777777777',
          referrerId: mockInactiveReferrer.id,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('should update member details', async () => {
      prisma.member.findUnique.mockResolvedValue(mockMember);
      prisma.member.update.mockResolvedValue({ ...mockMember, name: 'Updated Name' });

      const result = await service.update(mockMember.id, { name: 'Updated Name' });
      expect(result.name).toEqual('Updated Name');
    });

    it('should throw BadRequestException if setting self as referrer', async () => {
      prisma.member.findUnique.mockResolvedValue(mockMember);

      await expect(
        service.update(mockMember.id, { referrerId: mockMember.id }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return paginated list of members with metadata', async () => {
      prisma.member.count.mockResolvedValue(1);
      prisma.member.findMany.mockResolvedValue([mockMember]);

      const result = await service.findAll({ page: 1, limit: 10, search: 'New' });

      expect(result.data).toHaveLength(1);
      expect(result.meta).toEqual({
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });
  });

  describe('getReferrerInfo & getDownlinePreview', () => {
    it('should return populated referrer info', async () => {
      prisma.member.findUnique.mockResolvedValue({
        id: mockMember.id,
        memberCode: mockMember.memberCode,
        name: mockMember.name,
        referrer: mockActiveReferrer,
      });

      const result = await service.getReferrerInfo(mockMember.id);
      expect(result.referrer.id).toEqual(mockActiveReferrer.id);
    });

    it('should return 1-level downline preview', async () => {
      prisma.member.findUnique.mockResolvedValue(mockMember);
      prisma.member.findMany.mockResolvedValue([
        {
          id: 'child-1',
          memberCode: 'AK10004',
          name: 'Child 1',
          mobile: '+916666666666',
          status: MemberStatus.ACTIVE,
        },
      ]);

      const result = await service.getDownlinePreview(mockMember.id);

      expect(result.totalDirectReferrals).toEqual(1);
      expect(result.activeDirectReferrals).toEqual(1);
      expect(result.directReferrals).toHaveLength(1);
    });
  });
});
