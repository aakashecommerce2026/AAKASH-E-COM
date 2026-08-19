import { PrismaService } from '../../prisma/prisma.service';
import { QueryMemberEarningsBreakdownDto } from './dto/query-member-earnings-breakdown.dto';
import { QueryMemberActivityDto } from './dto/query-member-activity.dto';
export interface IEarningsTimeSeriesPoint {
    date: string;
    amount: number;
    count: number;
}
export interface IMemberTotalEarningsSummaryResponse {
    memberId: string;
    totalMembershipEarnings: number;
    totalRepurchaseEarnings: number;
    totalEarnings: number;
    totalDistributed: number;
    totalGrossDistributed: number;
    totalTdsDeducted: number;
    totalAdminFeeDeducted: number;
    totalPending: number;
    membershipBreakdown: Record<string, number>;
    repurchaseBreakdown: Record<string, number>;
    distributionSummary: {
        totalPaidRecordsCount: number;
        totalPendingRecordsCount: number;
        pendingLedgersAmount: number;
        pendingRecordsAmount: number;
    };
    calculatedAt: string;
}
export interface IMemberActivityItem {
    id: string;
    category: string;
    action: string;
    timestamp: string;
    details: Record<string, any>;
}
export declare class MemberPortalReportsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private buildDateWhere;
    getMembershipEarningsBreakdown(memberId: string, query: QueryMemberEarningsBreakdownDto): Promise<{
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
        timeSeries: IEarningsTimeSeriesPoint[];
        calculatedAt: string;
    }>;
    getRepurchaseEarningsBreakdown(memberId: string, query: QueryMemberEarningsBreakdownDto): Promise<{
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
        timeSeries: IEarningsTimeSeriesPoint[];
        calculatedAt: string;
    }>;
    getTotalEarningsSummary(memberId: string): Promise<IMemberTotalEarningsSummaryResponse>;
    getActivityHistory(memberId: string, query: QueryMemberActivityDto): Promise<{
        data: IMemberActivityItem[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
        calculatedAt: string;
    }>;
}
