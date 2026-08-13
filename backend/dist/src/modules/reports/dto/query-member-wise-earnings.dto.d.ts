import { CommissionStatus } from '@prisma/client';
export declare class QueryMemberWiseEarningsDto {
    startDate?: string;
    endDate?: string;
    status?: CommissionStatus;
    search?: string;
    page?: number;
    limit?: number;
}
