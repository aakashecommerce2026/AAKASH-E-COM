import { ReportsService } from './reports.service';
import { QueryAdminMembershipEarningsDto } from './dto/query-admin-membership-earnings.dto';
import { QueryEarningsAggregationDto } from './dto/query-earnings-aggregation.dto';
import { QueryMemberWiseEarningsDto } from './dto/query-member-wise-earnings.dto';
export declare class AdminEarningsMembershipController {
    private readonly reportsService;
    constructor(reportsService: ReportsService);
    getEarningsList(query: QueryAdminMembershipEarningsDto): Promise<{
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
            beneficiaryMember: {
                id: string;
                memberCode: string;
                name: string;
                mobile: string;
            };
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
            totalGrossAmount: number;
            pendingAmount: number;
            holdAmount: number;
            disbursedAmount: number;
            cancelledAmount: number;
        };
    }>;
    getLevelWiseEarnings(query: QueryEarningsAggregationDto): Promise<{
        level: number;
        totalAmount: number;
        totalCount: number;
        pendingAmount: number;
        holdAmount: number;
        disbursedAmount: number;
        cancelledAmount: number;
    }[]>;
    getMemberWiseEarnings(query: QueryMemberWiseEarningsDto): Promise<{
        data: {
            member: any;
            totalEarned: number;
            totalLedgers: number;
            pendingAmount: number;
            holdAmount: number;
            disbursedAmount: number;
            cancelledAmount: number;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
}
