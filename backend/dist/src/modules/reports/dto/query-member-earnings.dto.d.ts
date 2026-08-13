import { CommissionStatus } from '@prisma/client';
export declare class QueryMemberEarningsDto {
    startDate?: string;
    endDate?: string;
    level?: number;
    status?: CommissionStatus;
    page?: number;
    limit?: number;
}
