import { DashboardService } from './dashboard.service';
import { QueryDashboardDto } from './dto/query-dashboard.dto';
import { QueryActivityDto } from './dto/query-activity.dto';
export declare class DashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
    getMemberStats(query: QueryDashboardDto): Promise<import("./dashboard.service").IMemberStatsResponse>;
    getEarningsStats(query: QueryDashboardDto): Promise<import("./dashboard.service").IEarningsStatsResponse>;
    getBusinessStats(query: QueryDashboardDto): Promise<import("./dashboard.service").IBusinessStatsResponse>;
    getActivityFeed(query: QueryActivityDto): Promise<import("./dashboard.service").IActivityFeedResponse>;
}
