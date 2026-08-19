import { MemberPortalReportsService } from './member-portal-reports.service';
export declare class MemberEarningsTotalController {
    private readonly memberPortalReportsService;
    constructor(memberPortalReportsService: MemberPortalReportsService);
    getMyTotalEarnings(memberId: string): Promise<import("./member-portal-reports.service").IMemberTotalEarningsSummaryResponse>;
}
