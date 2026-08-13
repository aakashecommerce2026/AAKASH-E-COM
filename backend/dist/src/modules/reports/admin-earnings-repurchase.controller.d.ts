import { ReportsService } from './reports.service';
import { QueryAdminRepurchaseEarningsDto } from './dto/query-admin-repurchase-earnings.dto';
import { QueryEarningsAggregationDto } from './dto/query-earnings-aggregation.dto';
import { QueryMemberWiseEarningsDto } from './dto/query-member-wise-earnings.dto';
export declare class AdminEarningsRepurchaseController {
    private readonly reportsService;
    constructor(reportsService: ReportsService);
    getAdminRepurchaseEarnings(query: QueryAdminRepurchaseEarningsDto): Promise<{
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
            distributionRecordId: string | null;
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
    getLevelWiseRepurchaseEarnings(query: QueryEarningsAggregationDto): Promise<{
        level: number;
        totalAmount: number;
        totalCount: number;
        pendingAmount: number;
        holdAmount: number;
        disbursedAmount: number;
        cancelledAmount: number;
    }[]>;
    getMemberWiseRepurchaseEarnings(query: QueryMemberWiseEarningsDto): Promise<{
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
