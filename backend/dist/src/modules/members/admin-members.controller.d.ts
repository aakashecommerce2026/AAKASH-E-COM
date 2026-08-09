import { MemberRole } from '@prisma/client';
import { MembersService } from './members.service';
import { CreateAdminMemberDto } from './dto/create-admin-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { QueryMembersDto } from './dto/query-members.dto';
import { ReassignReferrerDto } from './dto/reassign-referrer.dto';
import { MemberResponseDto } from './dto/member-response.dto';
export declare class AdminMembersController {
    private readonly membersService;
    constructor(membersService: MembersService);
    createMember(dto: CreateAdminMemberDto, actorId: string, actorRole: MemberRole): Promise<MemberResponseDto & {
        tempPassword?: string;
    }>;
    updateMember(id: string, dto: UpdateMemberDto, actorId: string, actorRole: MemberRole): Promise<MemberResponseDto>;
    reassignReferrer(id: string, dto: ReassignReferrerDto, actorId: string, actorRole: MemberRole): Promise<MemberResponseDto>;
    getMembers(query: QueryMembersDto): Promise<{
        data: MemberResponseDto[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getMemberById(id: string): Promise<{
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
        name: string;
        mobile: string;
        email: string | null;
        address: string | null;
        referrerId: string | null;
        joiningDate: Date;
        upiId: string | null;
        bankDetails: import("@prisma/client/runtime/library").JsonValue | null;
        status: import("@prisma/client").$Enums.MemberStatus;
        role: import("@prisma/client").$Enums.MemberRole;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getMemberReferrer(id: string): Promise<{
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
    getMemberDownlinePreview(id: string): Promise<{
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
}
