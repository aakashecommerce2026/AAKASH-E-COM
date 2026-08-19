import { MemberPortalReportsService } from './member-portal-reports.service';
import { QueryMemberEarningsBreakdownDto } from './dto/query-member-earnings-breakdown.dto';
export declare class MemberEarningsRepurchaseController {
    private readonly memberPortalReportsService;
    constructor(memberPortalReportsService: MemberPortalReportsService);
    getMyRepurchaseEarnings(memberId: string, query: QueryMemberEarningsBreakdownDto): Promise<{
        data: {
            id: string;
            repurchaseEntryId: string;
            repurchaseEntry: {
                amount: number;
                id: string;
                transactionRef: string;
                transactionDate: Date;
            } | null;
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
            createdAt: string;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
        summary: {
            totalEarned: number;
            statusBreakdown: Record<string, number>;
            levelBreakdown: Record<string, number>;
        };
        timeSeries: import("./member-portal-reports.service").IEarningsTimeSeriesPoint[];
        calculatedAt: string;
    }>;
}
