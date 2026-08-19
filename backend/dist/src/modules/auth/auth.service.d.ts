import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
export declare class AuthService {
    private readonly prisma;
    private readonly jwtService;
    private readonly configService;
    private readonly auditService?;
    private readonly BCRYPT_SALT_ROUNDS;
    constructor(prisma: PrismaService, jwtService: JwtService, configService: ConfigService, auditService?: AuditService | undefined);
    hashPassword(password: string): Promise<string>;
    comparePassword(raw: string, hash: string): Promise<boolean>;
    validateUser(identifier: string, password: string): Promise<{
        id: string;
        memberCode: string;
        name: string;
        mobile: string;
        email: string | null;
        address: string | null;
        referrerId: string | null;
        joiningDate: Date;
        upiId: string | null;
        bankDetails: import("@prisma/client/runtime/library").JsonValue | null;
        status: import("@prisma/client").$Enums.MemberStatus;
        passwordHash: string;
        role: import("@prisma/client").$Enums.MemberRole;
        createdAt: Date;
        updatedAt: Date;
    }>;
    login(loginDto: LoginDto): Promise<AuthResponseDto>;
    refreshToken(refreshTokenDto: RefreshTokenDto): Promise<AuthResponseDto>;
    changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<{
        message: string;
    }>;
    private generateAuthTokens;
}
