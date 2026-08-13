import { ReportsService } from './reports.service';
import { QueryMemberEarningsDto } from './dto/query-member-earnings.dto';
export declare class MemberEarningsMembershipController {
    private readonly reportsService;
    constructor(reportsService: ReportsService);
    getMyMembershipEarnings(memberId: string, query: QueryMemberEarningsDto): Promise<{
        data: {
            id: string;
            sourceMemberId: string;
            sourceMember: {
                id: string;
                memberCode: string;
                name: string;
                mobile: string;
            };
            beneficiaryMemberId: string;
            level: number;
            percentage: number;
            amount: number;
            status: import("@prisma/client").$Enums.CommissionStatus;
            createdAt: Date;
            updatedAt: Date;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
        summary: {
            totalEarned: number;
            pendingAmount: number;
            holdAmount: number;
            disbursedAmount: number;
            cancelledAmount: number;
        };
    }>;
}
