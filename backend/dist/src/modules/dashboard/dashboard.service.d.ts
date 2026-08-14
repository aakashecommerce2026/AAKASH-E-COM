import { PrismaService } from '../../prisma/prisma.service';
import { DashboardCacheService } from './dashboard-cache.service';
import { QueryDashboardDto } from './dto/query-dashboard.dto';
import { QueryActivityDto, ActivityCategory } from './dto/query-activity.dto';
import { MemberStatus } from '@prisma/client';
export interface IMemberStatsResponse {
    totalMembers: number;
    joinedToday: number;
    joinedThisWeek: number;
    joinedThisMonth: number;
    statusBreakdown: Record<MemberStatus, number>;
    registrationTrend: Array<{
        date: string;
        count: number;
    }>;
    calculatedAt: string;
}
export interface IEarningsStatsResponse {
    totalMembershipEarnings: number;
    totalRepurchaseEarnings: number;
    totalEarnings: number;
    totalDistributed: number;
    totalGrossDistributed: number;
    totalTdsDeducted: number;
    totalAdminFeeDeducted: number;
    pendingDistributions: number;
    membershipEarningsBreakdown: Record<string, number>;
    repurchaseEarningsBreakdown: Record<string, number>;
    distributionSummary: {
        totalPaidRecordsCount: number;
        totalPendingRecordsCount: number;
        pendingLedgersAmount: number;
        pendingRecordsAmount: number;
    };
    calculatedAt: string;
}
export interface IBusinessStatsResponse {
    repurchaseSummary: {
        totalOrders: number;
        totalVolume: number;
        averageOrderValue: number;
        todayVolume: number;
        thisWeekVolume: number;
        thisMonthVolume: number;
        totalRepurchaseCommissionGenerated: number;
    };
    growthSummary: {
        totalMembers: number;
        activeMembers: number;
        activationRate: number;
        joinedToday: number;
        joinedThisWeek: number;
        joinedThisMonth: number;
        statusBreakdown: Record<MemberStatus, number>;
    };
    earningsSummary: {
        totalMembershipEarnings: number;
        totalRepurchaseEarnings: number;
        totalEarnings: number;
        totalDistributed: number;
        pendingDistributions: number;
        payoutRatio: number;
    };
    calculatedAt: string;
}
export interface IActivityFeedItem {
    id: string;
    category: ActivityCategory;
    action: string;
    timestamp: string;
    actor: {
        id: string;
        memberCode: string;
        name: string;
        role?: string;
    } | null;
    details: Record<string, any>;
}
export interface IActivityFeedResponse {
    data: IActivityFeedItem[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
    calculatedAt: string;
}
export declare class DashboardService {
    private readonly prisma;
    private readonly cacheService;
    private readonly logger;
    constructor(prisma: PrismaService, cacheService: DashboardCacheService);
    private getDateBoundaries;
    private buildDateWhere;
    getMemberStats(query: QueryDashboardDto): Promise<IMemberStatsResponse>;
    getEarningsStats(query: QueryDashboardDto): Promise<IEarningsStatsResponse>;
    getBusinessStats(query: QueryDashboardDto): Promise<IBusinessStatsResponse>;
    getActivityFeed(query: QueryActivityDto): Promise<IActivityFeedResponse>;
}
