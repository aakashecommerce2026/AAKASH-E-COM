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
export declare class MembersService {
    private readonly prisma;
    private readonly auditService;
    private readonly membershipCommissionService;
    private readonly BCRYPT_SALT_ROUNDS;
    constructor(prisma: PrismaService, auditService: AuditService, membershipCommissionService: MembershipCommissionService);
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
            mobile: string;
            email: string | null;
            name: string;
            status: import("@prisma/client").$Enums.MemberStatus;
            role: import("@prisma/client").$Enums.MemberRole;
        } | null;
        id: string;
        memberCode: string;
        mobile: string;
        email: string | null;
        name: string;
        address: string | null;
        referrerId: string | null;
        joiningDate: Date;
        upiId: string | null;
        bankDetails: Prisma.JsonValue | null;
        status: import("@prisma/client").$Enums.MemberStatus;
        role: import("@prisma/client").$Enums.MemberRole;
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
            mobile: string;
            email: string | null;
            name: string;
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
            mobile: string;
            email: string | null;
            name: string;
            joiningDate: Date;
            status: import("@prisma/client").$Enums.MemberStatus;
            role: import("@prisma/client").$Enums.MemberRole;
        }[];
    }>;
    private mapToResponseDto;
}
