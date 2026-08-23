"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bcrypt = __importStar(require("bcrypt"));
const prisma_service_1 = require("../../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const otp_service_1 = require("../otp/otp.service");
const email_service_1 = require("../email/email.service");
const otp_purpose_enum_1 = require("../otp/enums/otp-purpose.enum");
let AuthService = AuthService_1 = class AuthService {
    prisma;
    jwtService;
    configService;
    auditService;
    otpService;
    emailService;
    logger = new common_1.Logger(AuthService_1.name);
    BCRYPT_SALT_ROUNDS = 12;
    constructor(prisma, jwtService, configService, auditService, otpService, emailService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.configService = configService;
        this.auditService = auditService;
        this.otpService = otpService;
        this.emailService = emailService;
    }
    async hashPassword(password) {
        return bcrypt.hash(password, this.BCRYPT_SALT_ROUNDS);
    }
    async comparePassword(raw, hash) {
        return bcrypt.compare(raw, hash);
    }
    async validateAdminUser(identifier, password) {
        const member = await this.prisma.member.findFirst({
            where: {
                OR: [
                    { memberCode: identifier },
                    { email: identifier },
                    { mobile: identifier },
                ],
                role: { in: ['ADMIN', 'SUB_ADMIN'] },
            },
        });
        if (!member || !member.passwordHash) {
            throw new common_1.UnauthorizedException('Invalid admin credentials');
        }
        const isPasswordValid = await this.comparePassword(password, member.passwordHash);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid admin credentials');
        }
        if (member.status === 'BLOCKED' || member.status === 'SUSPENDED') {
            throw new common_1.UnauthorizedException('Admin account is blocked or suspended');
        }
        return member;
    }
    async validateMemberUser(identifier, password) {
        const member = await this.prisma.member.findFirst({
            where: {
                OR: [
                    { memberCode: identifier },
                    { email: identifier },
                    { mobile: identifier },
                ],
                role: 'MEMBER',
            },
        });
        if (!member || !member.passwordHash) {
            throw new common_1.UnauthorizedException('Invalid member credentials');
        }
        const isPasswordValid = await this.comparePassword(password, member.passwordHash);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid member credentials');
        }
        if (member.status === 'BLOCKED' || member.status === 'SUSPENDED') {
            throw new common_1.UnauthorizedException('Member account is blocked or suspended');
        }
        return member;
    }
    async validateUser(identifier, password, portalType) {
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
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const isPasswordValid = await this.comparePassword(password, member.passwordHash);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (member.status === 'BLOCKED' || member.status === 'SUSPENDED') {
            throw new common_1.UnauthorizedException('Account is blocked or suspended');
        }
        const isAdminRole = member.role === 'ADMIN' || member.role === 'SUB_ADMIN';
        if (portalType === 'Admin' && !isAdminRole) {
            throw new common_1.UnauthorizedException('Access denied. Only admin credentials can log in to the Admin Portal.');
        }
        if (portalType === 'Member' && isAdminRole) {
            throw new common_1.UnauthorizedException('Access denied. Admin credentials must be used on the Admin Login portal.');
        }
        return member;
    }
    async login(loginDto) {
        const member = await this.validateUser(loginDto.identifier, loginDto.password, loginDto.portalType);
        if (this.auditService) {
            const actionType = member.role === 'ADMIN' || member.role === 'SUB_ADMIN'
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
    async refreshToken(refreshTokenDto) {
        const { refreshToken } = refreshTokenDto;
        let payload;
        try {
            const secret = this.configService.get('JWT_SECRET') || 'dev-jwt-secret-key-12345';
            payload = await this.jwtService.verifyAsync(refreshToken, { secret });
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid or expired refresh token');
        }
        if (payload.type !== 'refresh') {
            throw new common_1.UnauthorizedException('Invalid token type for refresh');
        }
        const member = await this.prisma.member.findUnique({
            where: { id: payload.sub },
        });
        if (!member) {
            throw new common_1.UnauthorizedException('User no longer exists');
        }
        if (member.status === 'BLOCKED' || member.status === 'SUSPENDED') {
            throw new common_1.UnauthorizedException('Account is restricted');
        }
        return this.generateAuthTokens(member);
    }
    async changePassword(userId, changePasswordDto) {
        const member = await this.prisma.member.findUnique({
            where: { id: userId },
        });
        if (!member) {
            throw new common_1.UnauthorizedException('User not found');
        }
        const currentPwd = changePasswordDto.currentPassword || changePasswordDto.oldPassword;
        if (!currentPwd) {
            throw new common_1.BadRequestException('Current password is required');
        }
        const isCurrentPasswordValid = await this.comparePassword(currentPwd, member.passwordHash);
        if (!isCurrentPasswordValid) {
            throw new common_1.BadRequestException('Current password does not match');
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
    async generateAuthTokens(member) {
        const secret = this.configService.get('JWT_SECRET') || 'dev-jwt-secret-key-12345';
        const accessPayload = {
            sub: member.id,
            memberCode: member.memberCode,
            role: member.role,
            type: 'access',
        };
        const refreshPayload = {
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
    async forgotPassword(dto) {
        const member = await this.prisma.member.findFirst({
            where: { email: dto.email.trim().toLowerCase() },
        });
        if (!member || !member.email) {
            return { message: 'If an account with that email exists, a password reset link has been sent.' };
        }
        if (member.status === 'BLOCKED' || member.status === 'SUSPENDED') {
            throw new common_1.UnauthorizedException('Account is blocked or suspended');
        }
        if (this.otpService && this.emailService) {
            const { rawOtp } = await this.otpService.sendOtp({
                email: member.email,
                purpose: otp_purpose_enum_1.OtpPurpose.PASSWORD_RESET,
            });
            const otpCode = rawOtp || '';
            const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:5173';
            const resetLink = `${frontendUrl}/reset-password?email=${encodeURIComponent(member.email)}&token=${encodeURIComponent(otpCode)}`;
            this.logger.log(`
==================================================
🔑 PASSWORD RESET LINK FOR ${member.email}:
${resetLink}
==================================================
`);
            await this.emailService.sendPasswordResetLinkEmail(member.email, member.name, resetLink, otpCode);
        }
        return { message: 'If an account with that email exists, a password reset link has been sent.' };
    }
    async resetPassword(dto) {
        const { email, token, newPassword } = dto;
        const normalizedEmail = email.trim().toLowerCase();
        const member = await this.prisma.member.findFirst({
            where: { email: normalizedEmail },
        });
        if (!member) {
            throw new common_1.BadRequestException('Invalid request or member not found');
        }
        if (this.otpService) {
            await this.otpService.verifyOtp({
                email: normalizedEmail,
                otp: token,
                purpose: otp_purpose_enum_1.OtpPurpose.PASSWORD_RESET,
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
            await this.emailService.sendSecurityAlertEmail(member.email, member.name, 'Password Reset Completed');
        }
        return { message: 'Password has been reset successfully. You can now log in with your new password.' };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(3, (0, common_1.Optional)()),
    __param(4, (0, common_1.Optional)()),
    __param(5, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService,
        audit_service_1.AuditService,
        otp_service_1.OtpService,
        email_service_1.EmailService])
], AuthService);
//# sourceMappingURL=auth.service.js.map