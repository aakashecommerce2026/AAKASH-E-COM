import { MembershipCommissionService } from './membership-commission.service';
import { CreateCommissionConfigDto, MembershipCommissionConfigResponseDto } from './dto/membership-commission-config.dto';
import { QueryMembershipCommissionDto } from './dto/query-membership-commission.dto';
import { MembershipCommissionResponseDto } from './dto/membership-commission-response.dto';
export declare class MembershipCommissionController {
    private readonly membershipCommissionService;
    constructor(membershipCommissionService: MembershipCommissionService);
    getConfig(version?: number): Promise<MembershipCommissionConfigResponseDto[]>;
    createConfig(dto: CreateCommissionConfigDto, actorId: string): Promise<MembershipCommissionConfigResponseDto[]>;
    findAll(query: QueryMembershipCommissionDto): Promise<{
        data: {
            sourceMember: {
                id: string;
                memberCode: string;
                name: string;
                mobile: string;
            };
            beneficiaryMember: {
                id: string;
                memberCode: string;
                name: string;
                mobile: string;
            };
            id: string;
            sourceMemberId: string;
            beneficiaryMemberId: string;
            level: number;
            percentage: number | string;
            amount: number | string;
            status: import("@prisma/client").CommissionStatus;
            createdAt: Date;
            updatedAt: Date;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findById(id: string): Promise<MembershipCommissionResponseDto>;
    triggerRegistrationCommission(memberId: string, packageAmount?: number): Promise<MembershipCommissionResponseDto[]>;
}
