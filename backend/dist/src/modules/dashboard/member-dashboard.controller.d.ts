import { DashboardService } from './dashboard.service';
export declare class MemberDashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
    getMemberDashboard(memberId: string, refresh?: boolean): Promise<import("./dashboard.service").IMemberPersonalDashboardResponse>;
}
