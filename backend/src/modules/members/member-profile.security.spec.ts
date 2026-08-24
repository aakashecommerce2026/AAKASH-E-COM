import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import { OwnershipGuard } from '../auth/guards/ownership.guard';
import { MemberProfileController } from './member-profile.controller';
import { MemberProfileService } from './member-profile.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { MemberRole, MemberStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

describe('Member Profile Security & Ownership Guard Test Suite', () => {
  let guard: OwnershipGuard;
  let controller: MemberProfileController;
  let service: MemberProfileService;
  let auditService: AuditService;

  const mockMemberA = {
    id: 'member-uuid-A',
    memberCode: 'AK10001',
    name: 'Member Alice',
    email: 'alice@example.com',
    mobile: '+919876543210',
    passwordHash: '',
    role: MemberRole.MEMBER,
    status: MemberStatus.ACTIVE,
    bankDetails: { upiId: 'alice@okaxis' },
    joiningDate: new Date('2026-01-01'),
  };

  const mockMemberB = {
    id: 'member-uuid-B',
    memberCode: 'AK10002',
    name: 'Member Bob',
    email: 'bob@example.com',
    mobile: '+919876543211',
    passwordHash: '',
    role: MemberRole.MEMBER,
    status: MemberStatus.ACTIVE,
    bankDetails: { upiId: 'bob@okaxis' },
    joiningDate: new Date('2026-01-02'),
  };

  const mockPrismaService = {
    member: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockAuditService = {
    logAction: jest.fn().mockResolvedValue({ id: 'audit-log-id' }),
  };

  beforeAll(async () => {
    mockMemberA.passwordHash = await bcrypt.hash('CurrentP@ss123', 10);
    mockMemberB.passwordHash = await bcrypt.hash('CurrentP@ss123', 10);
  });

  beforeEach(async () => {
    guard = new OwnershipGuard();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MemberProfileController],
      providers: [
        MemberProfileService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    controller = module.get<MemberProfileController>(MemberProfileController);
    service = module.get<MemberProfileService>(MemberProfileService);
    auditService = module.get<AuditService>(AuditService);

    jest.clearAllMocks();
  });

  describe('1. OwnershipGuard ID Substitution Security Checks', () => {
    const createMockContext = (user: any, params: any = {}, body: any = {}): ExecutionContext => {
      return {
        switchToHttp: () => ({
          getRequest: () => ({ user, params, body }),
        }),
      } as any;
    };

    it('should REJECT request when Member A attempts ID substitution attack on Member B (params.id)', () => {
      const userA = { id: 'member-uuid-A', memberCode: 'AK10001', role: MemberRole.MEMBER };
      const ctx = createMockContext(userA, { id: 'member-uuid-B' });

      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('should REJECT request when Member A attempts ID substitution attack on Member B (params.memberId)', () => {
      const userA = { id: 'member-uuid-A', memberCode: 'AK10001', role: MemberRole.MEMBER };
      const ctx = createMockContext(userA, { memberId: 'member-uuid-B' });

      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('should REJECT request when Member A attempts ID substitution attack via request body (body.memberId)', () => {
      const userA = { id: 'member-uuid-A', memberCode: 'AK10001', role: MemberRole.MEMBER };
      const ctx = createMockContext(userA, {}, { memberId: 'member-uuid-B', name: 'Hacked Name' });

      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('should ALLOW request when Member A accesses or modifies their own resource ID', () => {
      const userA = { id: 'member-uuid-A', memberCode: 'AK10001', role: MemberRole.MEMBER };
      const ctx = createMockContext(userA, { id: 'member-uuid-A' });

      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('should ALLOW request when Admin accesses any Member ID (Global Access)', () => {
      const admin = { id: 'admin-uuid', memberCode: 'AK10000', role: MemberRole.ADMIN };
      const ctx = createMockContext(admin, { id: 'member-uuid-B' });

      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('should throw UnauthorizedException if request has no authenticated user', () => {
      const ctx = createMockContext(null);

      expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
    });
  });

  describe('2. Member Profile Management & Audit Logging', () => {
    it('GET /member/profile — view own profile', async () => {
      mockPrismaService.member.findUnique.mockResolvedValueOnce(mockMemberA);

      const res = await controller.getProfile('member-uuid-A');

      expect(res).toBeDefined();
      expect(res.id).toBe('member-uuid-A');
      expect(res.memberCode).toBe('AK10001');
      expect(res.name).toBe('Member Alice');
    });

    it('PUT /member/profile — update profile and log UPDATE_MEMBER_PROFILE action to activity_logs', async () => {
      mockPrismaService.member.findUnique.mockResolvedValueOnce(mockMemberA);
      mockPrismaService.member.findFirst.mockResolvedValueOnce(null); // no mobile/email collision
      mockPrismaService.member.update.mockResolvedValueOnce({
        ...mockMemberA,
        name: 'Alice Updated',
      });

      const updateDto = { name: 'Alice Updated', mobile: '+919876543210' };
      const res = await controller.updateProfile('member-uuid-A', MemberRole.MEMBER, updateDto);

      expect(res.name).toBe('Alice Updated');
      expect(mockAuditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          actionType: 'UPDATE_MEMBER_PROFILE',
          entityType: 'Member',
          entityId: 'member-uuid-A',
        }),
      );
    });

    it('PUT /member/profile — throw ConflictException on email collision', async () => {
      mockPrismaService.member.findUnique.mockResolvedValueOnce(mockMemberA);
      mockPrismaService.member.findFirst.mockResolvedValueOnce(mockMemberB); // collision found

      await expect(
        controller.updateProfile('member-uuid-A', MemberRole.MEMBER, { email: 'bob@example.com' }),
      ).rejects.toThrow(ConflictException);
    });

    it('PUT /member/profile — throw ConflictException on username collision', async () => {
      mockPrismaService.member.findUnique.mockResolvedValueOnce(mockMemberA);
      mockPrismaService.member.findFirst.mockResolvedValueOnce({ ...mockMemberB, username: 'taken_user' });

      await expect(
        controller.updateProfile('member-uuid-A', MemberRole.MEMBER, { username: 'taken_user' }),
      ).rejects.toThrow(ConflictException);
    });

    it('PUT /member/profile/upi — update UPI details and log UPDATE_MEMBER_UPI action to activity_logs', async () => {
      mockPrismaService.member.findUnique.mockResolvedValueOnce(mockMemberA);
      mockPrismaService.member.update.mockResolvedValueOnce({
        ...mockMemberA,
        bankDetails: { upiId: 'new.alice@okicici', upiName: 'Alice New' },
      });

      const upiDto = { upiId: 'new.alice@okicici', upiName: 'Alice New' };
      const res = await controller.updateUpi('member-uuid-A', MemberRole.MEMBER, upiDto);

      expect(res).toBeDefined();
      expect(mockAuditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          actionType: 'UPDATE_MEMBER_UPI',
          entityType: 'Member',
          entityId: 'member-uuid-A',
          metadata: expect.objectContaining({ upiId: 'new.alice@okicici' }),
        }),
      );
    });

    it('PUT /member/change-password — change password and log CHANGE_MEMBER_PASSWORD to activity_logs', async () => {
      mockPrismaService.member.findUnique.mockResolvedValueOnce(mockMemberA);
      mockPrismaService.member.update.mockResolvedValueOnce(mockMemberA);

      const changePwdDto = {
        oldPassword: 'CurrentP@ss123',
        newPassword: 'NewSecureP@ss2026',
      };

      const res = await controller.changePassword('member-uuid-A', MemberRole.MEMBER, changePwdDto);

      expect(res.message).toBe('Password changed successfully');
      expect(mockAuditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          actionType: 'CHANGE_MEMBER_PASSWORD',
          entityType: 'Member',
          entityId: 'member-uuid-A',
        }),
      );
    });

    it('PUT /member/change-password — throw BadRequestException if current password is wrong', async () => {
      mockPrismaService.member.findUnique.mockResolvedValueOnce(mockMemberA);

      const changePwdDto = {
        oldPassword: 'WrongPassword123',
        newPassword: 'NewSecureP@ss2026',
      };

      await expect(
        controller.changePassword('member-uuid-A', MemberRole.MEMBER, changePwdDto),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
