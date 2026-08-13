import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { MembersService } from './members.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { MembershipCommissionService } from '../membership-commission/membership-commission.service';
import { MemberRole, MemberStatus } from '@prisma/client';

describe('Admin Members Integration Test Suite', () => {
  let service: MembersService;
  let prisma: any;
  let auditService: any;

  const mockAdminUser = {
    id: 'admin-uuid-1',
    role: MemberRole.ADMIN,
  };

  const mockActiveReferrer = {
    id: 'referrer-uuid-10',
    memberCode: 'AK10010',
    name: 'Active Sponsor',
    mobile: '+919876543210',
    email: 'sponsor@example.com',
    status: MemberStatus.ACTIVE,
    role: MemberRole.MEMBER,
  };

  const mockMember = {
    id: 'member-uuid-20',
    memberCode: 'AK10020',
    name: 'Jane Doe',
    mobile: '+919876543220',
    email: 'jane@example.com',
    address: '123 Market St',
    status: MemberStatus.ACTIVE,
    role: MemberRole.MEMBER,
    passwordHash: 'hashed_password',
    referrerId: mockActiveReferrer.id,
    createdAt: new Date(),
    updatedAt: new Date(),
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

    const mockMembershipCommissionService = {
      processRegistrationCommissions: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MembersService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
        { provide: MembershipCommissionService, useValue: mockMembershipCommissionService },
      ],
    }).compile();

    service = module.get<MembersService>(MembersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('1. Member Creation & Active Referrer Validation', () => {
    it('should create member, auto-generate code/temp password, link referrer, and log activity audit', async () => {
      prisma.member.findFirst.mockResolvedValue(null);
      prisma.member.findUnique
        .mockResolvedValueOnce(null) // code uniqueness check
        .mockResolvedValueOnce(mockActiveReferrer); // referrer check

      prisma.member.create.mockResolvedValue(mockMember);

      const result = await service.createByAdmin(
        {
          name: 'Jane Doe',
          mobile: '+919876543220',
          referrerId: mockActiveReferrer.id,
        },
        mockAdminUser.id,
        mockAdminUser.role,
      );

      expect(result.id).toEqual(mockMember.id);
      expect(result).toHaveProperty('memberCode');
      expect(result).toHaveProperty('tempPassword');
      expect(auditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          actionType: 'CREATE_MEMBER',
          entityType: 'Member',
          entityId: mockMember.id,
          actorId: mockAdminUser.id,
        }),
      );
    });

    it('should reject creation if referrer is INACTIVE', async () => {
      const inactiveReferrer = { ...mockActiveReferrer, status: MemberStatus.BLOCKED };
      prisma.member.findFirst.mockResolvedValue(null);
      prisma.member.findUnique.mockImplementation(async ({ where }: any) => {
        if (where?.id === inactiveReferrer.id) return inactiveReferrer;
        return null;
      });

      await expect(
        service.createByAdmin({
          memberCode: 'AK10021',
          name: 'Invalid Referrer Member',
          mobile: '+919876543221',
          referrerId: inactiveReferrer.id,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('2. Member Editing & Commission Safeguard', () => {
    it('should edit member details and log activity audit', async () => {
      prisma.member.findUnique.mockResolvedValue(mockMember);
      prisma.member.update.mockResolvedValue({ ...mockMember, name: 'Jane Doe Updated' });

      const result = await service.update(
        mockMember.id,
        { name: 'Jane Doe Updated' },
        mockAdminUser.id,
        mockAdminUser.role,
      );

      expect(result.name).toEqual('Jane Doe Updated');
      expect(auditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          actionType: 'UPDATE_MEMBER',
          entityId: mockMember.id,
          actorId: mockAdminUser.id,
        }),
      );
    });

    it('should prevent standard referrer edit if commissions exist for member', async () => {
      prisma.member.findUnique.mockResolvedValue(mockMember);
      prisma.membershipCommissionLedger.count.mockResolvedValue(2); // commissions exist

      await expect(
        service.update(
          mockMember.id,
          { referrerId: 'new-referrer-uuid' },
          mockAdminUser.id,
          mockAdminUser.role,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('3. Guarded Referrer Reassignment', () => {
    it('should reassign referrer and record audit log with reason', async () => {
      const newReferrer = {
        id: 'new-referrer-uuid-30',
        name: 'New Sponsor',
        status: MemberStatus.ACTIVE,
        referrerId: null,
      };

      prisma.member.findUnique
        .mockResolvedValueOnce(mockMember) // target member lookup
        .mockResolvedValueOnce(newReferrer) // new referrer lookup
        .mockResolvedValueOnce(newReferrer); // cycle check upline lookup

      prisma.member.update.mockResolvedValue({ ...mockMember, referrerId: newReferrer.id });

      const result = await service.reassignReferrer(
        mockMember.id,
        { newReferrerId: newReferrer.id, reason: 'Admin team restructuring' },
        mockAdminUser.id,
        mockAdminUser.role,
      );

      expect(result.referrerId).toEqual(newReferrer.id);
      expect(auditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          actionType: 'REASSIGN_REFERRER',
          entityId: mockMember.id,
          metadata: expect.objectContaining({
            reason: 'Admin team restructuring',
            newReferrerId: newReferrer.id,
          }),
        }),
      );
    });
  });

  describe('4. Search & Pagination', () => {
    it('should perform multi-field search and return pagination metadata', async () => {
      prisma.member.count.mockResolvedValue(15);
      prisma.member.findMany.mockResolvedValue([mockMember]);

      const result = await service.findAll({
        page: 2,
        limit: 5,
        search: 'Jane',
        status: MemberStatus.ACTIVE,
      });

      expect(result.data).toHaveLength(1);
      expect(result.meta).toEqual({
        total: 15,
        page: 2,
        limit: 5,
        totalPages: 3,
      });
    });
  });
});
