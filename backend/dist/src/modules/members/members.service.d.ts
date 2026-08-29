import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { CreateAdminMemberDto } from './dto/create-admin-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { QueryMembersDto } from './dto/query-members.dto';
import { ReassignReferrerDto } from './dto/reassign-referrer.dto';
import { MemberResponseDto } from './dto/member-response.dto';
import { MemberRole, Prisma } from '@prisma/client';
import { MembershipCommissionService } from '../membership-commission/membership-commission.service';
import { EmailService } from '../email/email.service';
import { OtpService } from '../otp/otp.service';
import { PromotionsService } from '../promotions/promotions.service';
export declare class MembersService {
    private readonly prisma;
    private readonly auditService;
    private readonly membershipCommissionService;
    private readonly emailService?;
    private readonly otpService?;
    private readonly promotionsService?;
    private readonly logger;
    private readonly BCRYPT_SALT_ROUNDS;
    constructor(prisma: PrismaService, auditService: AuditService, membershipCommissionService: MembershipCommissionService, emailService?: EmailService | undefined, otpService?: OtpService | undefined, promotionsService?: PromotionsService | undefined);
    generateMemberCode(): Promise<string>;
    generateTempPassword(): string;
    create(createMemberDto: CreateMemberDto, actorId?: string, actorRole?: MemberRole): Promise<MemberResponseDto>;
    createByAdmin(dto: CreateAdminMemberDto, actorId?: string, actorRole?: MemberRole): Promise<MemberResponseDto & {
        tempPassword?: string;
    }>;
    private createMemberInternal;
    update(id: string, updateDto: UpdateMemberDto, actorId?: string, actorRole?: MemberRole): Promise<MemberResponseDto>;
    reassignReferrer(id: string, dto: ReassignReferrerDto, actorId?: string, actorRole?: MemberRole): Promise<MemberResponseDto>;
    private isMemberInUplineChain;
    private hasCommissionsAgainstMember;
    findById(id: string): Promise<MemberResponseDto>;
    findByIdWithReferrer(id: string): Promise<{
        referrer: {
            id: string;
            memberCode: string;
            name: string;
            mobile: string;
            email: string | null;
            status: import("@prisma/client").$Enums.MemberStatus;
            role: import("@prisma/client").$Enums.MemberRole;
        } | null;
        id: string;
        memberCode: string;
        username: string | null;
        name: string;
        mobile: string;
        email: string | null;
        address: string | null;
        profilePhoto: string | null;
        referrerId: string | null;
        joiningDate: Date;
        upiId: string | null;
        bankDetails: Prisma.JsonValue | null;
        status: import("@prisma/client").$Enums.MemberStatus;
        role: import("@prisma/client").$Enums.MemberRole;
        rank: import("@prisma/client").$Enums.MemberRank;
        isCommissionFrozen: boolean;
        commissionFreezeReason: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findAll(query: QueryMembersDto): Promise<{
        data: MemberResponseDto[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getReferrerInfo(id: string): Promise<{
        memberId: string;
        memberCode: string;
        memberName: string;
        referrer: {
            id: string;
            memberCode: string;
            name: string;
            mobile: string;
            email: string | null;
            joiningDate: Date;
            status: import("@prisma/client").$Enums.MemberStatus;
            role: import("@prisma/client").$Enums.MemberRole;
        } | null;
    }>;
    getDownlinePreview(id: string): Promise<{
        memberId: string;
        memberCode: string;
        memberName: string;
        totalDirectReferrals: number;
        activeDirectReferrals: number;
        directReferrals: {
            id: string;
            memberCode: string;
            name: string;
            mobile: string;
            email: string | null;
            joiningDate: Date;
            status: import("@prisma/client").$Enums.MemberStatus;
            role: import("@prisma/client").$Enums.MemberRole;
        }[];
    }>;
    calculateProfileCompletion(member: any): {
        completionPercentage: number;
        isProfileComplete: boolean;
        missingFields: string[];
    };
    toggleCommissionFreeze(id: string, dto: {
        isFrozen: boolean;
        reason?: string;
    }, actorId?: string, actorRole?: MemberRole): Promise<MemberResponseDto>;
    deleteMember(id: string, actorId?: string, actorRole?: MemberRole): Promise<{
        message: string;
        deletedMemberId: string;
        reattachedDownlinesCount: number;
    }>;
    private mapToResponseDto;
}
