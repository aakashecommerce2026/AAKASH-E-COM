import { ReportsService } from './reports.service';
import { QueryMemberEarningsDto } from './dto/query-member-earnings.dto';
export declare class MemberEarningsRepurchaseController {
    private readonly reportsService;
    constructor(reportsService: ReportsService);
    getMemberRepurchaseEarnings(loggedInUserId: string, query: QueryMemberEarningsDto): Promise<{
        data: {
            id: string;
            repurchaseEntryId: string;
            repurchaseEntry: {
                amount: number;
                id: string;
                transactionRef: string;
                transactionDate: Date;
            } | undefined;
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
