import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { MembersService } from './members.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { MemberRole, MemberStatus } from '@prisma/client';

describe('MembersService', () => {
  let service: MembersService;
  let prisma: any;
  let auditService: any;

  const mockActiveReferrer = {
    id: 'referrer-uuid-1',
    memberCode: 'AK10001',
    name: 'Active Referrer',
    mobile: '+919999999999',
    status: MemberStatus.ACTIVE,
    role: MemberRole.MEMBER,
  };

  const mockInactiveReferrer = {
    id: 'referrer-uuid-2',
    memberCode: 'AK10002',
    name: 'Blocked Referrer',
    mobile: '+918888888888',
    status: MemberStatus.BLOCKED,
    role: MemberRole.MEMBER,
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
        findFirst: jest.fn().mockResolvedValue(null),
        findUnique: jest.fn().mockImplementation(async ({ where }: any) => {
          if (where?.id === mockMember.id) return mockMember;
          if (where?.id === mockActiveReferrer.id) return mockActiveReferrer;
          if (where?.id === mockInactiveReferrer.id) return mockInactiveReferrer;
          return null;
        }),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue(mockMember),
        update: jest.fn().mockResolvedValue(mockMember),
      },
      membershipCommissionLedger: {
        count: jest.fn().mockResolvedValue(0),
      },
      repurchaseCommissionLedger: {
        count: jest.fn().mockResolvedValue(0),
      },
    };

    auditService = {
      logAction: jest.fn().mockResolvedValue({ id: 'log-uuid-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MembersService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<MembersService>(MembersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateMemberCode & generateTempPassword', () => {
    it('should generate member code based on total count', async () => {
      prisma.member.count.mockResolvedValue(10);
      prisma.member.findUnique.mockResolvedValue(null);

      const code = await service.generateMemberCode();
      expect(code).toBe('AK10011');
    });

    it('should increment code if collision exists', async () => {
      prisma.member.count.mockResolvedValue(10);
      prisma.member.findUnique
        .mockResolvedValueOnce({ id: 'existing-1' }) // AK10011 exists
        .mockResolvedValueOnce(null); // AK10012 available

      const code = await service.generateMemberCode();
      expect(code).toBe('AK10012');
    });

    it('should generate a temp password with AK@ prefix', () => {
      const tempPass = service.generateTempPassword();
      expect(tempPass).toMatch(/^AK@[a-z0-9]{6}$/);
    });
  });

  describe('create', () => {
    it('should create a member successfully', async () => {
      prisma.member.findFirst.mockResolvedValue(null);
      prisma.member.findUnique.mockResolvedValue(mockActiveReferrer);
      prisma.member.create.mockResolvedValue(mockMember);

      const result = await service.create({
        memberCode: 'AK10003',
        name: 'New Member',
        mobile: '+917777777777',
        password: 'password123',
        referrerId: mockActiveReferrer.id,
      });

      expect(result.id).toEqual(mockMember.id);
      expect(auditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({ actionType: 'CREATE_MEMBER' }),
      );
    });

    it('should throw ConflictException if memberCode already exists', async () => {
      prisma.member.findFirst.mockResolvedValue({ memberCode: 'AK10003' });

      await expect(
        service.create({
          memberCode: 'AK10003',
          name: 'New Member',
          mobile: '+917777777777',
          password: 'password123',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if mobile already exists', async () => {
      prisma.member.findFirst.mockResolvedValue({ mobile: '+917777777777' });

      await expect(
        service.create({
          memberCode: 'AK10003',
          name: 'New Member',
          mobile: '+917777777777',
          password: 'password123',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if email already exists', async () => {
      prisma.member.findFirst.mockResolvedValue({ email: 'new@example.com' });

      await expect(
        service.create({
          memberCode: 'AK10003',
          name: 'New Member',
          mobile: '+917777777777',
          email: 'new@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException if referrer does not exist', async () => {
      prisma.member.findFirst.mockResolvedValue(null);
      prisma.member.findUnique.mockResolvedValue(null);

      await expect(
        service.create({
          memberCode: 'AK10003',
          name: 'New Member',
          mobile: '+917777777777',
          password: 'password123',
          referrerId: 'non-existent-id',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if referrer is not active', async () => {
      prisma.member.findFirst.mockResolvedValue(null);
      prisma.member.findUnique.mockResolvedValue(mockInactiveReferrer);

      await expect(
        service.create({
          memberCode: 'AK10003',
          name: 'New Member',
          mobile: '+917777777777',
          password: 'password123',
          referrerId: mockInactiveReferrer.id,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('createByAdmin', () => {
    it('should create member with auto-generated code and temp password if missing, validating active referrer', async () => {
      prisma.member.findFirst.mockResolvedValue(null);
      prisma.member.findUnique.mockImplementation(async ({ where }: any) => {
        if (where?.id === mockActiveReferrer.id) return mockActiveReferrer;
        return null;
      });
      prisma.member.create.mockResolvedValue(mockMember);

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
      prisma.member.findUnique.mockImplementation(async ({ where }: any) => {
        if (where?.id === mockInactiveReferrer.id) return mockInactiveReferrer;
        return null;
      });

      await expect(
        service.createByAdmin({
          memberCode: 'AK10003',
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
      expect(auditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({ actionType: 'UPDATE_MEMBER' }),
      );
    });

    it('should throw NotFoundException if member not found', async () => {
      prisma.member.findUnique.mockResolvedValue(null);

      await expect(
        service.update('non-existent-id', { name: 'Updated Name' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if updated field collides', async () => {
      prisma.member.findUnique.mockResolvedValue(mockMember);
      prisma.member.findFirst.mockResolvedValue({ id: 'other-id', mobile: '+917777777777' });

      await expect(
        service.update(mockMember.id, { mobile: '+917777777777' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException if updating referrer when commissions exist', async () => {
      prisma.member.findUnique.mockResolvedValue(mockMember);
      prisma.membershipCommissionLedger.count.mockResolvedValue(1);

      await expect(
        service.update(mockMember.id, { referrerId: 'new-referrer-id' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if setting self as referrer', async () => {
      prisma.member.findUnique.mockResolvedValue(mockMember);
      prisma.membershipCommissionLedger.count.mockResolvedValue(0);
      prisma.repurchaseCommissionLedger.count.mockResolvedValue(0);

      await expect(
        service.update(mockMember.id, { referrerId: mockMember.id }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if new referrer does not exist or is inactive', async () => {
      prisma.member.findUnique
        .mockResolvedValueOnce(mockMember) // target member lookup
        .mockResolvedValueOnce(mockInactiveReferrer); // new referrer lookup

      await expect(
        service.update(mockMember.id, { referrerId: mockInactiveReferrer.id }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('reassignReferrer', () => {
    it('should reassign referrer and record audit log', async () => {
      const newReferrer = {
        id: 'new-referrer-id',
        name: 'New Referrer',
        status: MemberStatus.ACTIVE,
        referrerId: null,
      };

      prisma.member.findUnique
        .mockResolvedValueOnce(mockMember) // target member lookup
        .mockResolvedValueOnce(newReferrer) // new referrer lookup
        .mockResolvedValueOnce(newReferrer); // cycle check upline lookup

      prisma.member.update.mockResolvedValue({ ...mockMember, referrerId: newReferrer.id });

      const result = await service.reassignReferrer(mockMember.id, {
        newReferrerId: newReferrer.id,
        reason: 'Restructuring',
      });

      expect(result.referrerId).toEqual(newReferrer.id);
      expect(auditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({ actionType: 'REASSIGN_REFERRER' }),
      );
    });

    it('should throw NotFoundException if member not found', async () => {
      prisma.member.findUnique.mockResolvedValue(null);

      await expect(
        service.reassignReferrer('non-existent-id', {
          newReferrerId: 'new-id',
          reason: 'test',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if setting self as referrer', async () => {
      prisma.member.findUnique.mockResolvedValue(mockMember);

      await expect(
        service.reassignReferrer(mockMember.id, {
          newReferrerId: mockMember.id,
          reason: 'test',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if new referrer is inactive', async () => {
      prisma.member.findUnique
        .mockResolvedValueOnce(mockMember)
        .mockResolvedValueOnce(mockInactiveReferrer);

      await expect(
        service.reassignReferrer(mockMember.id, {
          newReferrerId: mockInactiveReferrer.id,
          reason: 'test',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if circular dependency detected', async () => {
      const childMember = {
        id: 'child-id',
        name: 'Child Member',
        status: MemberStatus.ACTIVE,
        referrerId: mockMember.id,
      };

      prisma.member.findUnique
        .mockResolvedValueOnce(mockMember) // target member lookup
        .mockResolvedValueOnce(childMember) // new referrer lookup
        .mockResolvedValueOnce(childMember) // cycle check 1st upline (childMember) -> referrerId is mockMember.id
        .mockResolvedValueOnce(mockMember); // cycle check 2nd upline (mockMember) -> matches targetId mockMember.id!

      await expect(
        service.reassignReferrer(mockMember.id, {
          newReferrerId: childMember.id,
          reason: 'Invalid cycle',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findById & findByIdWithReferrer', () => {
    it('should return member by id without passwordHash', async () => {
      prisma.member.findUnique.mockResolvedValue(mockMember);

      const result = await service.findById(mockMember.id);
      expect(result.id).toEqual(mockMember.id);
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should throw NotFoundException in findById if not found', async () => {
      prisma.member.findUnique.mockResolvedValue(null);

      await expect(service.findById('non-existent-id')).rejects.toThrow(NotFoundException);
    });

    it('should return member with referrer info in findByIdWithReferrer', async () => {
      prisma.member.findUnique.mockResolvedValue({
        ...mockMember,
        referrer: mockActiveReferrer,
      });

      const result = await service.findByIdWithReferrer(mockMember.id);
      expect(result.referrer).toBeDefined();
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should throw NotFoundException in findByIdWithReferrer if not found', async () => {
      prisma.member.findUnique.mockResolvedValue(null);

      await expect(service.findByIdWithReferrer('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
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

    it('should handle status, role, and custom sorting filters', async () => {
      prisma.member.count.mockResolvedValue(5);
      prisma.member.findMany.mockResolvedValue([mockMember]);

      const result = await service.findAll({
        page: 1,
        limit: 5,
        status: MemberStatus.ACTIVE,
        role: MemberRole.MEMBER,
        sortBy: 'name',
        sortOrder: 'asc',
      });

      expect(result.meta.total).toEqual(5);
      expect(prisma.member.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: MemberStatus.ACTIVE,
            role: MemberRole.MEMBER,
          }),
          orderBy: { name: 'asc' },
        }),
      );
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
      expect(result.referrer?.id).toEqual(mockActiveReferrer.id);
    });

    it('should throw NotFoundException in getReferrerInfo if member not found', async () => {
      prisma.member.findUnique.mockResolvedValue(null);

      await expect(service.getReferrerInfo('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
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

    it('should throw NotFoundException in getDownlinePreview if member not found', async () => {
      prisma.member.findUnique.mockResolvedValue(null);

      await expect(service.getDownlinePreview('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

