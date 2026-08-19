import { PrismaService } from '../../prisma/prisma.service';
import { QueryPeriodReportDto } from './dto/query-period-report.dto';
export type PeriodType = 'daily' | 'weekly' | 'monthly';
export declare class AdminReportsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getPeriodReport(period: PeriodType, query: QueryPeriodReportDto): Promise<{
        periodType: PeriodType;
        dateRange: {
            startDate: string;
            endDate: string;
        };
        summary: {
            totalRegistrations: number;
            statusBreakdown: Record<string, number>;
        };
        trend: {
            period: string;
            totalRegistrations: number;
            activeCount: number;
            pendingCount: number;
        }[];
        data: {
            id: string;
            memberCode: string;
            name: string;
            mobile: string;
            email: string | null;
            joiningDate: Date;
            status: import("@prisma/client").$Enums.MemberStatus;
            role: import("@prisma/client").$Enums.MemberRole;
            referrer: {
                id: string;
                memberCode: string;
                name: string;
            } | null;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
        calculatedAt: string;
    } | {
        periodType: PeriodType;
        dateRange: {
            startDate: string;
            endDate: string;
        };
        summary: {
            totalOrders: number;
            totalVolume: number;
            averageOrderValue: number;
            totalCommissionGenerated: number;
        };
        trend: {
            period: string;
            orderCount: number;
            totalVolume: number;
            averageOrderValue: number;
        }[];
        data: {
            id: string;
            transactionRef: string;
            memberId: string;
            member: {
                id: string;
                memberCode: string;
                name: string;
                mobile: string;
            };
            amount: number;
            transactionDate: Date;
            remarks: string | null;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
        calculatedAt: string;
    } | {
        periodType: PeriodType;
        dateRange: {
            startDate: string;
            endDate: string;
        };
        summary: {
            totalMembershipEarnings: number;
            totalRepurchaseEarnings: number;
            totalEarnings: number;
            totalGrossDistributed: number;
            totalNetDistributed: number;
            totalTdsDeducted: number;
            totalAdminFeeDeducted: number;
        };
        trend: {
            period: string;
            membershipEarnings: number;
            repurchaseEarnings: number;
            totalEarnings: number;
        }[];
        calculatedAt: string;
    } | {
        periodType: PeriodType;
        dateRange: {
            startDate: string;
            endDate: string;
        };
        summary: {
            totalRegistrations: number;
            activeRegistrations: number;
            repurchaseOrders: number;
            repurchaseVolume: number;
            averageOrderValue: number;
            totalEarningsGenerated: number;
            totalDistributed: number;
            payoutRatioPercentage: number;
        };
        registrationsTrend: {
            period: string;
            totalRegistrations: number;
            activeCount: number;
            pendingCount: number;
        }[];
        repurchaseTrend: {
            period: string;
            orderCount: number;
            totalVolume: number;
            averageOrderValue: number;
        }[];
        earningsTrend: {
            period: string;
            membershipEarnings: number;
            repurchaseEarnings: number;
            totalEarnings: number;
        }[];
        calculatedAt: string;
    }>;
    private getDefaultDateRange;
    private formatPeriodKey;
    private getMemberRegistrationsReport;
    private getRepurchaseActivitiesReport;
    private getEarningsSummaryReport;
    private getBusinessSummaryReport;
}
