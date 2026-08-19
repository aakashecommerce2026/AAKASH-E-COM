import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Optional,
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

@Injectable()
export class AuthService {
  private readonly BCRYPT_SALT_ROUNDS = 12;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Optional() private readonly auditService?: AuditService,
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
   * Validates member credentials by memberCode, email, or mobile.
   */
  async validateUser(identifier: string, password: string) {
    const member = await this.prisma.member.findFirst({
      where: {
        OR: [
          { memberCode: identifier },
          { email: identifier },
          { mobile: identifier },
        ],
      },
    });

    if (!member || !member.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.comparePassword(password, member.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (member.status === 'BLOCKED' || member.status === 'SUSPENDED') {
      throw new UnauthorizedException('Account is blocked or suspended');
    }

    return member;
  }

  /**
   * Handles user login and returns 15-minute access token & 7-day refresh token.
   */
  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const member = await this.validateUser(loginDto.identifier, loginDto.password);

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
  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<AuthResponseDto> {
    const { refreshToken } = refreshTokenDto;
    let payload: JwtPayload;

    try {
      const secret = this.configService.get<string>('JWT_SECRET') || 'dev-jwt-secret-key-12345';
      payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, { secret });
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

    const isCurrentPasswordValid = await this.comparePassword(
      changePasswordDto.currentPassword,
      member.passwordHash,
    );

    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password does not match');
    }

    const newPasswordHash = await this.hashPassword(changePasswordDto.newPassword);

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
    name: string;
    email: string | null;
    mobile: string;
    role: string;
    status: string;
  }): Promise<AuthResponseDto> {
    const secret = this.configService.get<string>('JWT_SECRET') || 'dev-jwt-secret-key-12345';

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

    const accessToken = await this.jwtService.signAsync(accessPayload, {
      secret,
      expiresIn: '15m',
    });

    const refreshToken = await this.jwtService.signAsync(refreshPayload, {
      secret,
      expiresIn: '7d',
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: member.id,
        memberCode: member.memberCode,
        name: member.name,
        email: member.email,
        mobile: member.mobile,
        role: member.role,
        status: member.status,
      },
    };
  }
}
