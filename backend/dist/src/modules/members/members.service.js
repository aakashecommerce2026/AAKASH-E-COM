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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MembersService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = __importStar(require("bcrypt"));
const prisma_service_1 = require("../../prisma/prisma.service");
const client_1 = require("@prisma/client");
let MembersService = class MembersService {
    prisma;
    BCRYPT_SALT_ROUNDS = 12;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async generateMemberCode() {
        const count = await this.prisma.member.count();
        let nextNum = 10001 + count;
        let code = `AK${nextNum}`;
        let exists = await this.prisma.member.findUnique({ where: { memberCode: code } });
        while (exists) {
            nextNum++;
            code = `AK${nextNum}`;
            exists = await this.prisma.member.findUnique({ where: { memberCode: code } });
        }
        return code;
    }
    generateTempPassword() {
        const randomChars = Math.random().toString(36).substring(2, 8);
        return `AK@${randomChars}`;
    }
    async create(createMemberDto) {
        return this.createMemberInternal(createMemberDto);
    }
    async createByAdmin(dto) {
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
        const created = await this.createMemberInternal(fullCreateDto);
        return {
            ...created,
            ...(generatedTemp ? { tempPassword } : {}),
        };
    }
    async createMemberInternal(createMemberDto) {
        const { password, bankDetails, referrerId, role, status, ...rest } = createMemberDto;
        const existing = await this.prisma.member.findFirst({
            where: {
                OR: [
                    { memberCode: rest.memberCode },
                    { mobile: rest.mobile },
                    ...(rest.email ? [{ email: rest.email }] : []),
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
        }
        if (referrerId) {
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
        const passwordHash = await bcrypt.hash(password, this.BCRYPT_SALT_ROUNDS);
        const createdMember = await this.prisma.member.create({
            data: {
                ...rest,
                passwordHash,
                referrerId: referrerId || null,
                role: role || client_1.MemberRole.MEMBER,
                status: status || client_1.MemberStatus.ACTIVE,
                bankDetails: bankDetails ? JSON.parse(JSON.stringify(bankDetails)) : undefined,
            },
        });
        return this.mapToResponseDto(createdMember);
    }
    async update(id, updateDto) {
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
        if (referrerId !== undefined) {
            if (referrerId === id) {
                throw new common_1.BadRequestException('A member cannot be set as their own referrer');
            }
            if (referrerId !== null) {
                const referrer = await this.prisma.member.findUnique({ where: { id: referrerId } });
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
                    ? { bankDetails: bankDetails ? JSON.parse(JSON.stringify(bankDetails)) : null }
                    : {}),
            },
        });
        return this.mapToResponseDto(updatedMember);
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
        const { page = 1, limit = 10, search, status, role, sortBy = 'createdAt', sortOrder = 'desc' } = query;
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
        const validSortFields = ['createdAt', 'joiningDate', 'name', 'memberCode', 'status'];
        const orderByField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
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
    mapToResponseDto(member) {
        const { passwordHash, ...result } = member;
        return result;
    }
};
exports.MembersService = MembersService;
exports.MembersService = MembersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MembersService);
//# sourceMappingURL=members.service.js.map