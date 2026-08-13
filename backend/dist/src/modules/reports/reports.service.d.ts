import { PrismaService } from '../../prisma/prisma.service';
import { QueryAdminMembershipEarningsDto } from './dto/query-admin-membership-earnings.dto';
import { QueryAdminRepurchaseEarningsDto } from './dto/query-admin-repurchase-earnings.dto';
import { QueryEarningsAggregationDto } from './dto/query-earnings-aggregation.dto';
import { QueryMemberWiseEarningsDto } from './dto/query-member-wise-earnings.dto';
import { QueryMemberEarningsDto } from './dto/query-member-earnings.dto';
export declare class ReportsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private buildDateWhere;
    getAdminMembershipEarnings(query: QueryAdminMembershipEarningsDto): Promise<{
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
    getMemberEarnings(loggedInUserId: string, query: QueryMemberEarningsDto): Promise<{
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
