import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Optional,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { JwtPayload } from './strategies/jwt.strategy';

import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { OtpService } from '../otp/otp.service';
import { EmailService } from '../email/email.service';
import { OtpPurpose } from '../otp/enums/otp-purpose.enum';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly BCRYPT_SALT_ROUNDS = 12;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Optional() private readonly auditService?: AuditService,
    @Optional() private readonly otpService?: OtpService,
    @Optional() private readonly emailService?: EmailService,
  ) {}

  /**
   * Hashes a raw password using bcrypt with 12 salt rounds.
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.BCRYPT_SALT_ROUNDS);
  }

  /**
   * Compares a raw password against a stored bcrypt hash.
   */
  async comparePassword(raw: string, hash: string): Promise<boolean> {
    return bcrypt.compare(raw, hash);
  }

  /**
   * Validates admin credentials specifically (ADMIN or SUB_ADMIN role).
   */
  async validateAdminUser(identifier: string, password: string) {
    const member = await this.prisma.member.findFirst({
      where: {
        OR: [
          { memberCode: identifier },
          { username: identifier } as any,
          { email: identifier },
          { mobile: identifier },
        ],
        role: { in: ['ADMIN', 'SUB_ADMIN'] },
      },
    });

    if (!member || !member.passwordHash) {
      throw new UnauthorizedException('Invalid admin credentials');
    }

    const isPasswordValid = await this.comparePassword(
      password,
      member.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid admin credentials');
    }

    if (member.status === 'BLOCKED' || member.status === 'SUSPENDED') {
      throw new UnauthorizedException('Admin account is blocked or suspended');
    }

    return member;
  }

  /**
   * Validates member credentials specifically (MEMBER role).
   */
  async validateMemberUser(identifier: string, password: string) {
    const member = await this.prisma.member.findFirst({
      where: {
        OR: [
          { memberCode: identifier },
          { username: identifier } as any,
          { email: identifier },
          { mobile: identifier },
        ],
        role: 'MEMBER',
      },
    });

    if (!member || !member.passwordHash) {
      throw new UnauthorizedException('Invalid member credentials');
    }

    const isPasswordValid = await this.comparePassword(
      password,
      member.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid member credentials');
    }

    if (member.status === 'BLOCKED' || member.status === 'SUSPENDED') {
      throw new UnauthorizedException('Member account is blocked or suspended');
    }

    return member;
  }

  /**
   * Validates credentials by memberCode, email, or mobile with optional portal role enforcement.
   */
  async validateUser(
    identifier: string,
    password: string,
    portalType?: string,
  ) {
    const member = await this.prisma.member.findFirst({
      where: {
        OR: [
          { memberCode: identifier },
          { username: identifier } as any,
          { email: identifier },
          { mobile: identifier },
        ],
      },
    });

    if (!member || !member.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.comparePassword(
      password,
      member.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (member.status === 'BLOCKED' || member.status === 'SUSPENDED') {
      throw new UnauthorizedException('Account is blocked or suspended');
    }

    const isAdminRole = member.role === 'ADMIN' || member.role === 'SUB_ADMIN';

    if (portalType === 'Admin' && !isAdminRole) {
      throw new UnauthorizedException(
        'Access denied. Only admin credentials can log in to the Admin Portal.',
      );
    }

    if (portalType === 'Member' && isAdminRole) {
      throw new UnauthorizedException(
        'Access denied. Admin credentials must be used on the Admin Login portal.',
      );
    }

    return member;
  }

  /**
   * Handles user login and returns 15-minute access token & 7-day refresh token.
   */
  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const member = await this.validateUser(
      loginDto.identifier,
      loginDto.password,
      loginDto.portalType,
    );

    if (this.auditService) {
      const actionType =
        member.role === 'ADMIN' || member.role === 'SUB_ADMIN'
          ? 'ADMIN_LOGIN'
          : 'MEMBER_LOGIN';

      await this.auditService.logAction({
        actorId: member.id,
        actorRole: member.role,
        actionType,
        entityType: 'Member',
        entityId: member.id,
        metadata: { memberCode: member.memberCode },
      });
    }

    return this.generateAuthTokens(member);
  }

  /**
   * Rotates access and refresh tokens using a valid refresh token.
   */
  async refreshToken(
    refreshTokenDto: RefreshTokenDto,
  ): Promise<AuthResponseDto> {
    const { refreshToken } = refreshTokenDto;
    let payload: JwtPayload;

    try {
      const secret =
        this.configService.get<string>('JWT_SECRET') ||
        'dev-jwt-secret-key-12345';
      payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid token type for refresh');
    }

    const member = await this.prisma.member.findUnique({
      where: { id: payload.sub },
    });

    if (!member) {
      throw new UnauthorizedException('User no longer exists');
    }

    if (member.status === 'BLOCKED' || member.status === 'SUSPENDED') {
      throw new UnauthorizedException('Account is restricted');
    }

    return this.generateAuthTokens(member);
  }

  /**
   * Changes the password for an authenticated member/admin.
   */
  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const member = await this.prisma.member.findUnique({
      where: { id: userId },
    });

    if (!member) {
      throw new UnauthorizedException('User not found');
    }

    const currentPwd =
      changePasswordDto.currentPassword || changePasswordDto.oldPassword;
    if (!currentPwd) {
      throw new BadRequestException('Current password is required');
    }

    const isCurrentPasswordValid = await this.comparePassword(
      currentPwd,
      member.passwordHash,
    );

    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password does not match');
    }

    const newPasswordHash = await this.hashPassword(
      changePasswordDto.newPassword,
    );

    await this.prisma.member.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    if (this.auditService) {
      await this.auditService.logAction({
        actorId: member.id,
        actorRole: member.role,
        actionType: 'CHANGE_PASSWORD',
        entityType: 'Member',
        entityId: member.id,
        metadata: { memberCode: member.memberCode },
      });
    }

    return { message: 'Password changed successfully' };
  }

  /**
   * Helper to generate Access Token (15 min) and Refresh Token (7 days).
   */
  private async generateAuthTokens(member: {
    id: string;
    memberCode: string;
    username?: string | null;
    name: string;
    email: string | null;
    mobile: string;
    address?: string | null;
    profilePhoto?: string | null;
    role: string;
    status: string;
  }): Promise<AuthResponseDto> {
    const secret =
      this.configService.get<string>('JWT_SECRET') ||
      'dev-jwt-secret-key-12345';

    const accessPayload: JwtPayload = {
      sub: member.id,
      memberCode: member.memberCode,
      role: member.role,
      type: 'access',
    };

    const refreshPayload: JwtPayload = {
      sub: member.id,
      memberCode: member.memberCode,
      role: member.role,
      type: 'refresh',
    };

    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN') || '7d';

    const accessToken = await this.jwtService.signAsync(accessPayload, {
      secret,
      expiresIn: expiresIn as any,
    });

    const refreshToken = await this.jwtService.signAsync(refreshPayload, {
      secret,
      expiresIn: '30d',
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: member.id,
        memberCode: member.memberCode,
        username: member.username || null,
        name: member.name,
        email: member.email,
        mobile: member.mobile,
        address: (member as any).address || null,
        profilePhoto: (member as any).profilePhoto || null,
        role: member.role,
        status: member.status,
        rank: (member as any).rank || 'NONE',
      },
    };
  }

  /**
   * Dispatches a Password Reset Link Email containing token / OTP.
   */
  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const member = await this.prisma.member.findFirst({
      where: { email: dto.email.trim().toLowerCase() },
    });

    if (!member || !member.email) {
      return {
        message:
          'If an account with that email exists, a password reset link has been sent.',
      };
    }

    if (member.status === 'BLOCKED' || member.status === 'SUSPENDED') {
      throw new UnauthorizedException('Account is blocked or suspended');
    }

    if (this.otpService && this.emailService) {
      const { rawOtp } = await this.otpService.sendOtp({
        email: member.email,
        purpose: OtpPurpose.PASSWORD_RESET,
      });

      const otpCode = rawOtp || '';
      const frontendUrl =
        this.configService.get<string>('FRONTEND_URL') ||
        'http://localhost:5173';
      const resetLink = `${frontendUrl}/reset-password?email=${encodeURIComponent(member.email)}&token=${encodeURIComponent(otpCode)}`;

      this.logger.log(`
==================================================
🔑 PASSWORD RESET LINK FOR ${member.email}:
${resetLink}
==================================================
`);

      await this.emailService.sendPasswordResetLinkEmail(
        member.email,
        member.name,
        resetLink,
      );
    }

    return {
      message:
        'If an account with that email exists, a password reset link has been sent.',
    };
  }

  /**
   * Resets member password using token / OTP code.
   */
  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const { email, token, newPassword } = dto;
    const normalizedEmail = email.trim().toLowerCase();

    const member = await this.prisma.member.findFirst({
      where: { email: normalizedEmail },
    });

    if (!member) {
      throw new BadRequestException('Invalid request or member not found');
    }

    if (this.otpService) {
      await this.otpService.verifyOtp({
        email: normalizedEmail,
        otp: token,
        purpose: OtpPurpose.PASSWORD_RESET,
      });
    }

    const newPasswordHash = await this.hashPassword(newPassword);

    await this.prisma.member.update({
      where: { id: member.id },
      data: { passwordHash: newPasswordHash },
    });

    if (this.auditService) {
      await this.auditService.logAction({
        actorId: member.id,
        actorRole: member.role,
        actionType: 'RESET_PASSWORD_WITH_OTP',
        entityType: 'Member',
        entityId: member.id,
        metadata: { memberCode: member.memberCode, email: member.email },
      });
    }

    if (this.emailService && member.email) {
      await this.emailService.sendSecurityAlertEmail(
        member.email,
        member.name,
        'Password Reset Completed',
      );
    }

    return {
      message:
        'Password has been reset successfully. You can now log in with your new password.',
    };
  }
}
