import { MemberPortalReportsService } from './member-portal-reports.service';
import { QueryMemberActivityDto } from './dto/query-member-activity.dto';
export declare class MemberActivityController {
    private readonly memberPortalReportsService;
    constructor(memberPortalReportsService: MemberPortalReportsService);
    getMyActivityHistory(memberId: string, query: QueryMemberActivityDto): Promise<{
        data: import("./member-portal-reports.service").IMemberActivityItem[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
        calculatedAt: string;
    }>;
}
