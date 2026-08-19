import { CommissionStatus } from '@prisma/client';
export declare enum EarningsTimeRange {
    DAILY = "daily",
    WEEKLY = "weekly",
    MONTHLY = "monthly"
}
export declare class QueryMemberEarningsBreakdownDto {
    range?: EarningsTimeRange;
    startDate?: string;
    endDate?: string;
    status?: CommissionStatus;
    page?: number;
    limit?: number;
}
