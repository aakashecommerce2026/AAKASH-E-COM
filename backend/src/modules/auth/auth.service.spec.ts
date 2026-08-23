import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { MemberRole, MemberStatus } from '@prisma/client';

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: any;
  let jwtService: any;
  let configService: any;

  const mockMember = {
    id: 'member-uuid-1',
    memberCode: 'AK10001',
    name: 'John Doe',
    email: 'john@example.com',
    mobile: '+919876543210',
    role: MemberRole.MEMBER,
    status: MemberStatus.ACTIVE,
    passwordHash: '$2b$12$eImiTXuWVxfM37uY4JANjO5E/805.O07Gf5D.w8Xl3f.F1iQ7uSgK', // hash for 'Password123!'
  };

  beforeEach(async () => {
    prismaService = {
      member: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    jwtService = {
      signAsync: jest.fn().mockResolvedValue('mock-jwt-token'),
      verifyAsync: jest.fn(),
    };

    configService = {
      get: jest.fn().mockReturnValue('dev-jwt-secret-key-12345'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaService },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser / login', () => {
    it('should login successfully with valid credentials and return access & refresh tokens', async () => {
      jest.spyOn(service, 'comparePassword').mockResolvedValue(true);
      prismaService.member.findFirst.mockResolvedValue(mockMember);

      const result = await service.login({
        identifier: 'AK10001',
        password: 'Password123!',
      });

      expect(prismaService.member.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            { memberCode: 'AK10001' },
            { email: 'AK10001' },
            { mobile: 'AK10001' },
          ],
        },
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.id).toEqual(mockMember.id);
      expect(result.user.memberCode).toEqual(mockMember.memberCode);
    });

    it('should throw UnauthorizedException on invalid credentials (user not found)', async () => {
      prismaService.member.findFirst.mockResolvedValue(null);

      await expect(
        service.login({
          identifier: 'invalid_code',
          password: 'Password123!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException on wrong password', async () => {
      prismaService.member.findFirst.mockResolvedValue(mockMember);
      jest.spyOn(service, 'comparePassword').mockResolvedValue(false);

      await expect(
        service.login({
          identifier: 'AK10001',
          password: 'WrongPassword!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if member is BLOCKED', async () => {
      const blockedMember = { ...mockMember, status: MemberStatus.BLOCKED };
      prismaService.member.findFirst.mockResolvedValue(blockedMember);
      jest.spyOn(service, 'comparePassword').mockResolvedValue(true);

      await expect(
        service.login({
          identifier: 'AK10001',
          password: 'Password123!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when a standard MEMBER attempts login to Admin portal', async () => {
      prismaService.member.findFirst.mockResolvedValue(mockMember); // mockMember is MEMBER role
      jest.spyOn(service, 'comparePassword').mockResolvedValue(true);

      await expect(
        service.login({
          identifier: 'AK10001',
          password: 'Password123!',
          portalType: 'Admin',
        }),
      ).rejects.toThrow('Access denied. Only admin credentials can log in to the Admin Portal.');
    });

    it('should throw UnauthorizedException when an ADMIN attempts login to Member portal', async () => {
      const mockAdmin = { ...mockMember, role: MemberRole.ADMIN };
      prismaService.member.findFirst.mockResolvedValue(mockAdmin);
      jest.spyOn(service, 'comparePassword').mockResolvedValue(true);

      await expect(
        service.login({
          identifier: 'AK100000',
          password: 'Password123!',
          portalType: 'Member',
        }),
      ).rejects.toThrow('Access denied. Admin credentials must be used on the Admin Login portal.');
    });

    it('should allow ADMIN login to Admin portal', async () => {
      const mockAdmin = { ...mockMember, role: MemberRole.ADMIN };
      prismaService.member.findFirst.mockResolvedValue(mockAdmin);
      jest.spyOn(service, 'comparePassword').mockResolvedValue(true);

      const result = await service.login({
        identifier: 'AK100000',
        password: 'Password123!',
        portalType: 'Admin',
      });

      expect(result.user.role).toEqual(MemberRole.ADMIN);
    });

    it('should validate admin user with validateAdminUser', async () => {
      const mockAdmin = { ...mockMember, role: MemberRole.ADMIN };
      prismaService.member.findFirst.mockResolvedValue(mockAdmin);
      jest.spyOn(service, 'comparePassword').mockResolvedValue(true);

      const admin = await service.validateAdminUser('AK100000', 'Password123!');
      expect(admin.role).toEqual(MemberRole.ADMIN);
      expect(prismaService.member.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            { memberCode: 'AK100000' },
            { email: 'AK100000' },
            { mobile: 'AK100000' },
          ],
          role: { in: ['ADMIN', 'SUB_ADMIN'] },
        },
      });
    });

    it('should validate member user with validateMemberUser', async () => {
      prismaService.member.findFirst.mockResolvedValue(mockMember);
      jest.spyOn(service, 'comparePassword').mockResolvedValue(true);

      const member = await service.validateMemberUser('AK10001', 'Password123!');
      expect(member.role).toEqual(MemberRole.MEMBER);
      expect(prismaService.member.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            { memberCode: 'AK10001' },
            { email: 'AK10001' },
            { mobile: 'AK10001' },
          ],
          role: 'MEMBER',
        },
      });
    });
  });

  describe('refreshToken', () => {
    it('should rotate tokens successfully with a valid refresh token', async () => {
      jwtService.verifyAsync.mockResolvedValue({
        sub: mockMember.id,
        memberCode: mockMember.memberCode,
        role: mockMember.role,
        type: 'refresh',
      });

      prismaService.member.findUnique.mockResolvedValue(mockMember);

      const result = await service.refreshToken({
        refreshToken: 'valid-refresh-token',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.id).toEqual(mockMember.id);
    });

    it('should reject refresh token if type is access instead of refresh', async () => {
      jwtService.verifyAsync.mockResolvedValue({
        sub: mockMember.id,
        memberCode: mockMember.memberCode,
        role: mockMember.role,
        type: 'access',
      });

      await expect(
        service.refreshToken({ refreshToken: 'access-token-used-as-refresh' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should reject expired or invalid refresh token', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error('Token expired'));

      await expect(
        service.refreshToken({ refreshToken: 'expired-token' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('changePassword', () => {
    it('should change password successfully when current password is correct', async () => {
      prismaService.member.findUnique.mockResolvedValue(mockMember);
      jest.spyOn(service, 'comparePassword').mockResolvedValue(true);
      jest.spyOn(service, 'hashPassword').mockResolvedValue('new-hashed-password');
      prismaService.member.update.mockResolvedValue({ ...mockMember, passwordHash: 'new-hashed-password' });

      const result = await service.changePassword(mockMember.id, {
        currentPassword: 'Password123!',
        newPassword: 'NewPassword123!',
      });

      expect(result).toEqual({ message: 'Password changed successfully' });
      expect(prismaService.member.update).toHaveBeenCalledWith({
        where: { id: mockMember.id },
        data: { passwordHash: 'new-hashed-password' },
      });
    });

    it('should throw BadRequestException if current password is incorrect', async () => {
      prismaService.member.findUnique.mockResolvedValue(mockMember);
      jest.spyOn(service, 'comparePassword').mockResolvedValue(false);

      await expect(
        service.changePassword(mockMember.id, {
          currentPassword: 'WrongPassword!',
          newPassword: 'NewPassword123!',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
