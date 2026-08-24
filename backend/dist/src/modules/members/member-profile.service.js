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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemberProfileService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = __importStar(require("bcrypt"));
const prisma_service_1 = require("../../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const dashboard_cache_service_1 = require("../dashboard/dashboard-cache.service");
let MemberProfileService = class MemberProfileService {
    prisma;
    auditService;
    dashboardCacheService;
    BCRYPT_SALT_ROUNDS = 12;
    constructor(prisma, auditService, dashboardCacheService) {
        this.prisma = prisma;
        this.auditService = auditService;
        this.dashboardCacheService = dashboardCacheService;
    }
    async getProfile(memberId) {
        const member = await this.prisma.member.findUnique({
            where: { id: memberId },
            include: {
                referrer: {
                    select: {
                        id: true,
                        memberCode: true,
                        name: true,
                        email: true,
                        mobile: true,
                    },
                },
            },
        });
        if (!member) {
            throw new common_1.NotFoundException(`Member with ID '${memberId}' not found`);
        }
        return this.mapToResponseDto(member);
    }
    async updateProfile(memberId, updateDto, actorId, actorRole) {
        const member = await this.prisma.member.findUnique({
            where: { id: memberId },
        });
        if (!member) {
            throw new common_1.NotFoundException(`Member with ID '${memberId}' not found`);
        }
        const { email, mobile, name, username, address, profilePhoto, upiId, bankDetails, } = updateDto;
        if (mobile || email || username) {
            const existing = await this.prisma.member.findFirst({
                where: {
                    AND: [
                        { id: { not: memberId } },
                        {
                            OR: [
                                ...(mobile ? [{ mobile }] : []),
                                ...(email ? [{ email }] : []),
                                ...(username ? [{ username }] : []),
                            ],
                        },
                    ],
                },
            });
            if (existing) {
                if (mobile && existing.mobile === mobile) {
                    throw new common_1.ConflictException(`Mobile number '${mobile}' is already taken`);
                }
                if (email && existing.email === email) {
                    throw new common_1.ConflictException(`Email address '${email}' is already taken`);
                }
                if (username && existing.username === username) {
                    throw new common_1.ConflictException(`Username '${username}' is already taken`);
                }
            }
        }
        const updatedMember = await this.prisma.member.update({
            where: { id: memberId },
            data: {
                ...(name !== undefined ? { name } : {}),
                ...(username !== undefined ? { username } : {}),
                ...(email !== undefined ? { email } : {}),
                ...(mobile !== undefined ? { mobile } : {}),
                ...(address !== undefined ? { address } : {}),
                ...(profilePhoto !== undefined ? { profilePhoto } : {}),
                ...(upiId !== undefined ? { upiId } : {}),
                ...(bankDetails !== undefined
                    ? {
                        bankDetails: bankDetails
                            ? JSON.parse(JSON.stringify(bankDetails))
                            : null,
                    }
                    : {}),
            },
        });
        await this.auditService.logAction({
            actorId: actorId || memberId,
            actorRole: actorRole || updatedMember.role,
            actionType: 'UPDATE_MEMBER_PROFILE',
            entityType: 'Member',
            entityId: updatedMember.id,
            metadata: {
                updatedFields: Object.keys(updateDto),
            },
        });
        await this.dashboardCacheService?.invalidateMemberCache();
        return this.mapToResponseDto(updatedMember);
    }
    async updateProfilePhoto(memberId, photoUrl) {
        const member = await this.prisma.member.findUnique({
            where: { id: memberId },
        });
        if (!member) {
            throw new common_1.NotFoundException(`Member with ID '${memberId}' not found`);
        }
        const updatedMember = await this.prisma.member.update({
            where: { id: memberId },
            data: {
                profilePhoto: photoUrl,
            },
        });
        if (this.auditService) {
            await this.auditService.logAction({
                actorId: memberId,
                actorRole: updatedMember.role,
                actionType: 'UPDATE_PROFILE_PHOTO',
                entityType: 'Member',
                entityId: updatedMember.id,
                metadata: { profilePhoto: photoUrl },
            });
        }
        await this.dashboardCacheService?.invalidateMemberCache();
        return this.mapToResponseDto(updatedMember);
    }
    async updateUpi(memberId, dto, actorId, actorRole) {
        const member = await this.prisma.member.findUnique({
            where: { id: memberId },
        });
        if (!member) {
            throw new common_1.NotFoundException(`Member with ID '${memberId}' not found`);
        }
        const existingBankDetails = member.bankDetails || {};
        const updatedBankDetails = {
            ...existingBankDetails,
            upiId: dto.upiId,
            upiName: dto.upiName || existingBankDetails.upiName || member.name,
        };
        const updatedMember = await this.prisma.member.update({
            where: { id: memberId },
            data: {
                bankDetails: JSON.parse(JSON.stringify(updatedBankDetails)),
            },
        });
        await this.auditService.logAction({
            actorId: actorId || memberId,
            actorRole: actorRole || updatedMember.role,
            actionType: 'UPDATE_MEMBER_UPI',
            entityType: 'Member',
            entityId: updatedMember.id,
            metadata: {
                upiId: dto.upiId,
                upiName: dto.upiName,
            },
        });
        await this.dashboardCacheService?.invalidateMemberCache();
        return this.mapToResponseDto(updatedMember);
    }
    async changeMemberPassword(memberId, dto, actorId, actorRole) {
        const member = await this.prisma.member.findUnique({
            where: { id: memberId },
        });
        if (!member) {
            throw new common_1.NotFoundException(`Member with ID '${memberId}' not found`);
        }
        const currentPwd = dto.currentPassword || dto.oldPassword;
        if (!currentPwd) {
            throw new common_1.BadRequestException('Current password is required');
        }
        const isCurrentPasswordValid = await bcrypt.compare(currentPwd, member.passwordHash);
        if (!isCurrentPasswordValid) {
            throw new common_1.BadRequestException('Current password does not match');
        }
        const newPasswordHash = await bcrypt.hash(dto.newPassword, this.BCRYPT_SALT_ROUNDS);
        await this.prisma.member.update({
            where: { id: memberId },
            data: { passwordHash: newPasswordHash },
        });
        await this.auditService.logAction({
            actorId: actorId || memberId,
            actorRole: actorRole || member.role,
            actionType: 'CHANGE_MEMBER_PASSWORD',
            entityType: 'Member',
            entityId: member.id,
            metadata: {
                memberCode: member.memberCode,
            },
        });
        return { message: 'Password changed successfully' };
    }
    mapToResponseDto(member) {
        const { passwordHash, ...result } = member;
        return result;
    }
};
exports.MemberProfileService = MemberProfileService;
exports.MemberProfileService = MemberProfileService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        dashboard_cache_service_1.DashboardCacheService])
], MemberProfileService);
//# sourceMappingURL=member-profile.service.js.map