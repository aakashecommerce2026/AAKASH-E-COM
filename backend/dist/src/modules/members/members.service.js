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
var MembersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MembersService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = __importStar(require("bcrypt"));
const prisma_service_1 = require("../../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const client_1 = require("@prisma/client");
const membership_commission_service_1 = require("../membership-commission/membership-commission.service");
const email_service_1 = require("../email/email.service");
const otp_service_1 = require("../otp/otp.service");
const otp_purpose_enum_1 = require("../otp/enums/otp-purpose.enum");
const promotions_service_1 = require("../promotions/promotions.service");
let MembersService = MembersService_1 = class MembersService {
    prisma;
    auditService;
    membershipCommissionService;
    emailService;
    otpService;
    promotionsService;
    logger = new common_1.Logger(MembersService_1.name);
    BCRYPT_SALT_ROUNDS = 12;
    constructor(prisma, auditService, membershipCommissionService, emailService, otpService, promotionsService) {
        this.prisma = prisma;
        this.auditService = auditService;
        this.membershipCommissionService = membershipCommissionService;
        this.emailService = emailService;
        this.otpService = otpService;
        this.promotionsService = promotionsService;
    }
    async generateMemberCode() {
        const count = await this.prisma.member.count();
        let nextNum = 10001 + count;
        let code = `AK${nextNum}`;
        let exists = await this.prisma.member.findUnique({
            where: { memberCode: code },
        });
        while (exists) {
            nextNum++;
            code = `AK${nextNum}`;
            exists = await this.prisma.member.findUnique({
                where: { memberCode: code },
            });
        }
        return code;
    }
    generateTempPassword() {
        const randomChars = Math.random().toString(36).substring(2, 8);
        return `AK@${randomChars}`;
    }
    async create(createMemberDto, actorId, actorRole) {
        return this.createMemberInternal(createMemberDto, actorId, actorRole);
    }
    async createByAdmin(dto, actorId, actorRole) {
        let memberCode = dto.memberCode;
        if (!memberCode) {
            memberCode = await this.generateMemberCode();
        }
        let tempPassword = dto.password;
        let generatedTemp = false;
        if (!tempPassword) {
            tempPassword = this.generateTempPassword();
            generatedTemp = true;
        }
        const fullCreateDto = {
            ...dto,
            memberCode,
            password: tempPassword,
        };
        const created = await this.createMemberInternal(fullCreateDto, actorId, actorRole);
        return {
            ...created,
            tempPassword,
        };
    }
    async createMemberInternal(createMemberDto, actorId, actorRole) {
        const { password, bankDetails, referrerId, role, status, otp, ...rest } = createMemberDto;
        if (this.otpService && otp && rest.email) {
            await this.otpService.verifyOtp({
                email: rest.email,
                otp,
                purpose: otp_purpose_enum_1.OtpPurpose.EMAIL_VERIFICATION,
            });
        }
        const existing = await this.prisma.member.findFirst({
            where: {
                OR: [
                    { memberCode: rest.memberCode },
                    { mobile: rest.mobile },
                    ...(rest.email ? [{ email: rest.email }] : []),
                    ...(rest.username ? [{ username: rest.username }] : []),
                ],
            },
        });
        if (existing) {
            if (existing.memberCode === rest.memberCode) {
                throw new common_1.ConflictException(`Member code '${rest.memberCode}' already exists`);
            }
            if (existing.mobile === rest.mobile) {
                throw new common_1.ConflictException(`Mobile number '${rest.mobile}' already exists`);
            }
            if (rest.email && existing.email === rest.email) {
                throw new common_1.ConflictException(`Email address '${rest.email}' already exists`);
            }
            if (rest.username && existing.username === rest.username) {
                throw new common_1.ConflictException(`Username '${rest.username}' already exists`);
            }
        }
        let assignedReferrerId = referrerId;
        if (!assignedReferrerId) {
            const rootMember = await this.prisma.member.findFirst({
                where: {
                    OR: [
                        { memberCode: 'ADM-0001' },
                        { role: client_1.MemberRole.ADMIN },
                        { memberCode: 'AK10001' },
                        { referrerId: null },
                    ],
                    status: client_1.MemberStatus.ACTIVE,
                },
                orderBy: { joiningDate: 'asc' },
            });
            if (rootMember) {
                assignedReferrerId = rootMember.id;
            }
        }
        if (assignedReferrerId) {
            const referrer = await this.prisma.member.findUnique({
                where: { id: assignedReferrerId },
            });
            if (!referrer) {
                throw new common_1.BadRequestException(`Referrer with ID '${assignedReferrerId}' does not exist`);
            }
            if (referrer.status !== client_1.MemberStatus.ACTIVE) {
                throw new common_1.BadRequestException(`Referrer with ID '${assignedReferrerId}' is not active (current status: ${referrer.status})`);
            }
        }
        const passwordHash = await bcrypt.hash(password, this.BCRYPT_SALT_ROUNDS);
        return this.prisma.$transaction(async (tx) => {
            const createdMember = await tx.member.create({
                data: {
                    ...rest,
                    passwordHash,
                    referrerId: assignedReferrerId || null,
                    role: role || client_1.MemberRole.MEMBER,
                    status: status || client_1.MemberStatus.ACTIVE,
                    bankDetails: bankDetails
                        ? JSON.parse(JSON.stringify(bankDetails))
                        : undefined,
                },
            });
            const joiningFeeAmount = rest.joiningFee && Number(rest.joiningFee) > 0
                ? Number(rest.joiningFee)
                : 10000;
            const generatedCommissions = await this.membershipCommissionService.calculateForNewMember(createdMember.id, joiningFeeAmount, tx);
            await this.auditService.logAction({
                actorId: actorId || createdMember.id,
                actorRole: actorRole || createdMember.role,
                actionType: 'CREATE_MEMBER',
                entityType: 'Member',
                entityId: createdMember.id,
                metadata: {
                    memberCode: createdMember.memberCode,
                    name: createdMember.name,
                    referrerId: createdMember.referrerId,
                    role: createdMember.role,
                },
            }, tx);
            if (generatedCommissions.length > 0) {
                const totalAmount = generatedCommissions.reduce((sum, c) => sum + Number(c.amount), 0);
                await this.auditService.logAction({
                    actorId: actorId || createdMember.id,
                    actorRole: actorRole || createdMember.role,
                    actionType: 'GENERATE_MEMBERSHIP_COMMISSIONS',
                    entityType: 'MembershipCommissionLedger',
                    entityId: createdMember.id,
                    metadata: {
                        sourceMemberId: createdMember.id,
                        memberCode: createdMember.memberCode,
                        commissionsCount: generatedCommissions.length,
                        totalCommissionAmount: totalAmount,
                        beneficiaryCount: generatedCommissions.length,
                    },
                }, tx);
            }
            if (this.promotionsService && referrerId) {
                await this.promotionsService
                    .evaluateAndPromoteMember(referrerId, tx)
                    .catch(() => { });
            }
            const result = this.mapToResponseDto(createdMember);
            if (this.emailService && createdMember.email) {
                this.emailService
                    .sendWelcomeEmail(createdMember.email, createdMember.name, createdMember.memberCode)
                    .catch(() => { });
            }
            return result;
        });
    }
    async update(id, updateDto, actorId, actorRole) {
        const member = await this.prisma.member.findUnique({ where: { id } });
        if (!member) {
            throw new common_1.NotFoundException(`Member with ID '${id}' not found`);
        }
        const { password, bankDetails, referrerId, ...rest } = updateDto;
        if (rest.memberCode || rest.mobile || rest.email) {
            const existing = await this.prisma.member.findFirst({
                where: {
                    AND: [
                        { id: { not: id } },
                        {
                            OR: [
                                ...(rest.memberCode ? [{ memberCode: rest.memberCode }] : []),
                                ...(rest.mobile ? [{ mobile: rest.mobile }] : []),
                                ...(rest.email ? [{ email: rest.email }] : []),
                            ],
                        },
                    ],
                },
            });
            if (existing) {
                if (rest.memberCode && existing.memberCode === rest.memberCode) {
                    throw new common_1.ConflictException(`Member code '${rest.memberCode}' is already taken`);
                }
                if (rest.mobile && existing.mobile === rest.mobile) {
                    throw new common_1.ConflictException(`Mobile number '${rest.mobile}' is already taken`);
                }
                if (rest.email && existing.email === rest.email) {
                    throw new common_1.ConflictException(`Email address '${rest.email}' is already taken`);
                }
            }
        }
        if (referrerId !== undefined && referrerId !== member.referrerId) {
            const hasCommissions = await this.hasCommissionsAgainstMember(id);
            if (hasCommissions) {
                throw new common_1.BadRequestException(`Cannot change referrer via standard update because commissions exist against this member. Use the guarded POST /admin/members/${id}/reassign-referrer endpoint.`);
            }
            if (referrerId === id) {
                throw new common_1.BadRequestException('A member cannot be set as their own referrer');
            }
            if (referrerId !== null) {
                const referrer = await this.prisma.member.findUnique({
                    where: { id: referrerId },
                });
                if (!referrer) {
                    throw new common_1.BadRequestException(`Referrer with ID '${referrerId}' does not exist`);
                }
                if (referrer.status !== client_1.MemberStatus.ACTIVE) {
                    throw new common_1.BadRequestException(`Referrer with ID '${referrerId}' is not active (current status: ${referrer.status})`);
                }
            }
        }
        let passwordHash;
        if (password) {
            passwordHash = await bcrypt.hash(password, this.BCRYPT_SALT_ROUNDS);
        }
        const updatedMember = await this.prisma.member.update({
            where: { id },
            data: {
                ...rest,
                ...(passwordHash ? { passwordHash } : {}),
                ...(referrerId !== undefined ? { referrerId } : {}),
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
            actorId: actorId || id,
            actorRole: actorRole || updatedMember.role,
            actionType: 'UPDATE_MEMBER',
            entityType: 'Member',
            entityId: updatedMember.id,
            metadata: {
                updatedFields: Object.keys(updateDto),
                newStatus: updatedMember.status,
            },
        });
        return this.mapToResponseDto(updatedMember);
    }
    async reassignReferrer(id, dto, actorId, actorRole) {
        const member = await this.prisma.member.findUnique({ where: { id } });
        if (!member) {
            throw new common_1.NotFoundException(`Member with ID '${id}' not found`);
        }
        const { newReferrerId, reason } = dto;
        if (newReferrerId === id) {
            throw new common_1.BadRequestException('A member cannot be set as their own referrer');
        }
        const newReferrer = await this.prisma.member.findUnique({
            where: { id: newReferrerId },
        });
        if (!newReferrer) {
            throw new common_1.BadRequestException(`New referrer with ID '${newReferrerId}' does not exist`);
        }
        if (newReferrer.status !== client_1.MemberStatus.ACTIVE) {
            throw new common_1.BadRequestException(`New referrer with ID '${newReferrerId}' is not active (status: ${newReferrer.status})`);
        }
        const isCycle = await this.isMemberInUplineChain(newReferrerId, id);
        if (isCycle) {
            throw new common_1.BadRequestException(`Circular dependency detected: Member '${newReferrer.name}' is already in the downline of '${member.name}'`);
        }
        const previousReferrerId = member.referrerId;
        const updatedMember = await this.prisma.member.update({
            where: { id },
            data: { referrerId: newReferrerId },
        });
        await this.auditService.logAction({
            actorId: actorId || null,
            actorRole: actorRole || client_1.MemberRole.ADMIN,
            actionType: 'REASSIGN_REFERRER',
            entityType: 'Member',
            entityId: id,
            metadata: {
                previousReferrerId,
                newReferrerId,
                reason,
            },
        });
        return this.mapToResponseDto(updatedMember);
    }
    async isMemberInUplineChain(startMemberId, targetId) {
        let currentId = startMemberId;
        const visited = new Set();
        while (currentId) {
            if (currentId === targetId) {
                return true;
            }
            visited.add(currentId);
            const parent = await this.prisma.member.findUnique({
                where: { id: currentId },
                select: { referrerId: true },
            });
            if (!parent || !parent.referrerId || visited.has(parent.referrerId)) {
                break;
            }
            currentId = parent.referrerId;
        }
        return false;
    }
    async hasCommissionsAgainstMember(memberId) {
        const [membershipCount, repurchaseCount] = await Promise.all([
            this.prisma.membershipCommissionLedger.count({
                where: {
                    OR: [{ sourceMemberId: memberId }, { beneficiaryMemberId: memberId }],
                },
            }),
            this.prisma.repurchaseCommissionLedger.count({
                where: {
                    OR: [{ sourceMemberId: memberId }, { beneficiaryMemberId: memberId }],
                },
            }),
        ]);
        return membershipCount > 0 || repurchaseCount > 0;
    }
    async findById(id) {
        const member = await this.prisma.member.findUnique({
            where: { id },
        });
        if (!member) {
            throw new common_1.NotFoundException(`Member with ID '${id}' not found`);
        }
        return this.mapToResponseDto(member);
    }
    async findByIdWithReferrer(id) {
        const member = await this.prisma.member.findUnique({
            where: { id },
            include: {
                referrer: {
                    select: {
                        id: true,
                        memberCode: true,
                        name: true,
                        email: true,
                        mobile: true,
                        role: true,
                        status: true,
                    },
                },
            },
        });
        if (!member) {
            throw new common_1.NotFoundException(`Member with ID '${id}' not found`);
        }
        const { passwordHash, ...result } = member;
        return result;
    }
    async findAll(query) {
        const { page = 1, limit = 10, search, status, role, sortBy = 'createdAt', sortOrder = 'desc', } = query;
        const skip = (page - 1) * limit;
        const where = {};
        if (status) {
            where.status = status;
        }
        if (role) {
            where.role = role;
        }
        if (search && search.trim() !== '') {
            const term = search.trim();
            where.OR = [
                { name: { contains: term, mode: 'insensitive' } },
                { memberCode: { contains: term, mode: 'insensitive' } },
                { mobile: { contains: term } },
                { email: { contains: term, mode: 'insensitive' } },
            ];
        }
        const validSortFields = [
            'createdAt',
            'joiningDate',
            'name',
            'memberCode',
            'status',
        ];
        const orderByField = validSortFields.includes(sortBy)
            ? sortBy
            : 'createdAt';
        const [total, members] = await Promise.all([
            this.prisma.member.count({ where }),
            this.prisma.member.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [orderByField]: sortOrder },
                include: {
                    referrer: {
                        select: {
                            id: true,
                            memberCode: true,
                            name: true,
                        },
                    },
                },
            }),
        ]);
        const data = members.map((m) => this.mapToResponseDto(m));
        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async getReferrerInfo(id) {
        const member = await this.prisma.member.findUnique({
            where: { id },
            select: {
                id: true,
                memberCode: true,
                name: true,
                referrer: {
                    select: {
                        id: true,
                        memberCode: true,
                        name: true,
                        email: true,
                        mobile: true,
                        status: true,
                        role: true,
                        joiningDate: true,
                    },
                },
            },
        });
        if (!member) {
            throw new common_1.NotFoundException(`Member with ID '${id}' not found`);
        }
        return {
            memberId: member.id,
            memberCode: member.memberCode,
            memberName: member.name,
            referrer: member.referrer || null,
        };
    }
    async getDownlinePreview(id) {
        const member = await this.prisma.member.findUnique({
            where: { id },
            select: { id: true, memberCode: true, name: true },
        });
        if (!member) {
            throw new common_1.NotFoundException(`Member with ID '${id}' not found`);
        }
        const directReferrals = await this.prisma.member.findMany({
            where: { referrerId: id },
            select: {
                id: true,
                memberCode: true,
                name: true,
                mobile: true,
                email: true,
                status: true,
                role: true,
                joiningDate: true,
            },
            orderBy: { joiningDate: 'desc' },
        });
        const activeCount = directReferrals.filter((r) => r.status === client_1.MemberStatus.ACTIVE).length;
        return {
            memberId: member.id,
            memberCode: member.memberCode,
            memberName: member.name,
            totalDirectReferrals: directReferrals.length,
            activeDirectReferrals: activeCount,
            directReferrals,
        };
    }
    calculateProfileCompletion(member) {
        if (!member) {
            return {
                completionPercentage: 0,
                isProfileComplete: false,
                missingFields: [],
            };
        }
        const fields = [
            {
                name: 'Full Name',
                weight: 15,
                check: !!(member.name && member.name.trim()),
            },
            {
                name: 'Mobile Number',
                weight: 15,
                check: !!(member.mobile && member.mobile.trim()),
            },
            {
                name: 'Email Address',
                weight: 15,
                check: !!(member.email && member.email.trim()),
            },
            {
                name: 'Username Handle',
                weight: 15,
                check: !!(member.username && member.username.trim()),
            },
            {
                name: 'Address Details',
                weight: 15,
                check: !!(member.address && member.address.trim()),
            },
            {
                name: 'Payment Details (UPI/Bank)',
                weight: 20,
                check: !!((member.upiId && member.upiId.trim()) ||
                    (member.bankDetails &&
                        typeof member.bankDetails === 'object' &&
                        (member.bankDetails.accountNumber ||
                            member.bankDetails.account_number))),
            },
            {
                name: 'Profile Photo',
                weight: 5,
                check: !!(member.profilePhoto && member.profilePhoto.trim()),
            },
        ];
        let completionPercentage = 0;
        const missingFields = [];
        fields.forEach((f) => {
            if (f.check) {
                completionPercentage += f.weight;
            }
            else {
                missingFields.push(f.name);
            }
        });
        return {
            completionPercentage,
            isProfileComplete: completionPercentage >= 100,
            missingFields,
        };
    }
    async toggleCommissionFreeze(id, dto, actorId, actorRole) {
        const member = await this.prisma.member.findUnique({ where: { id } });
        if (!member) {
            throw new common_1.NotFoundException(`Member with ID '${id}' not found`);
        }
        const updated = await this.prisma.member.update({
            where: { id },
            data: {
                isCommissionFrozen: dto.isFrozen,
                commissionFreezeReason: dto.isFrozen
                    ? dto.reason || 'Incomplete profile details'
                    : null,
            },
        });
        await this.auditService.logAction({
            actorId: actorId || null,
            actorRole: actorRole || client_1.MemberRole.ADMIN,
            actionType: dto.isFrozen ? 'FREEZE_COMMISSION' : 'UNFREEZE_COMMISSION',
            entityType: 'Member',
            entityId: id,
            metadata: {
                isCommissionFrozen: dto.isFrozen,
                reason: dto.reason || null,
            },
        });
        return this.mapToResponseDto(updated);
    }
    async deleteMember(id, actorId, actorRole) {
        const member = await this.prisma.member.findUnique({
            where: { id },
            select: {
                id: true,
                memberCode: true,
                name: true,
                email: true,
                role: true,
                referrerId: true,
            },
        });
        if (!member) {
            throw new common_1.NotFoundException(`Member with ID '${id}' not found`);
        }
        if (member.role === client_1.MemberRole.ADMIN || member.referrerId === null) {
            throw new common_1.BadRequestException(`Cannot delete root Super Admin account '${member.memberCode}'`);
        }
        const superAdmin = await this.prisma.member.findFirst({
            where: {
                OR: [{ role: client_1.MemberRole.ADMIN }, { referrerId: null }],
            },
            orderBy: { joiningDate: 'asc' },
            select: { id: true, memberCode: true },
        });
        if (!superAdmin) {
            throw new common_1.BadRequestException('Super Admin root member not found in database to receive re-attached downlines');
        }
        if (member.email && this.emailService) {
            try {
                await this.emailService.sendAccountDeletionEmail(member.email, member.name, member.memberCode);
            }
            catch (err) {
                this.logger.warn(`Failed to dispatch deletion email to ${member.email}: ${err.message}`);
            }
        }
        return this.prisma.$transaction(async (tx) => {
            const reattached = await tx.member.updateMany({
                where: { referrerId: id },
                data: { referrerId: superAdmin.id },
            });
            await tx.member.delete({
                where: { id },
            });
            await this.auditService.logAction({
                actorId: actorId || null,
                actorRole: actorRole || client_1.MemberRole.ADMIN,
                actionType: 'DELETE_MEMBER',
                entityType: 'Member',
                entityId: id,
                metadata: {
                    deletedMemberCode: member.memberCode,
                    deletedMemberName: member.name,
                    reattachedDownlinesCount: reattached.count,
                    superAdminId: superAdmin.id,
                    superAdminCode: superAdmin.memberCode,
                },
            });
            return {
                message: `Member '${member.name}' (${member.memberCode}) deleted successfully. ${reattached.count} downline members re-attached to Super Admin (${superAdmin.memberCode}).`,
                deletedMemberId: id,
                reattachedDownlinesCount: reattached.count,
            };
        });
    }
    mapToResponseDto(member) {
        const { passwordHash, ...result } = member;
        const profileStats = this.calculateProfileCompletion(member);
        return {
            ...result,
            profileCompletionPercentage: profileStats.completionPercentage,
            isProfileComplete: profileStats.isProfileComplete,
            missingProfileFields: profileStats.missingFields,
            isCommissionFrozen: member.isCommissionFrozen ?? false,
            commissionFreezeReason: member.commissionFreezeReason ?? null,
        };
    }
};
exports.MembersService = MembersService;
exports.MembersService = MembersService = MembersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(3, (0, common_1.Optional)()),
    __param(4, (0, common_1.Optional)()),
    __param(5, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        membership_commission_service_1.MembershipCommissionService,
        email_service_1.EmailService,
        otp_service_1.OtpService,
        promotions_service_1.PromotionsService])
], MembersService);
//# sourceMappingURL=members.service.js.map