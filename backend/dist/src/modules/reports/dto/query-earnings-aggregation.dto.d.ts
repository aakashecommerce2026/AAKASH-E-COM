import { CommissionStatus } from '@prisma/client';
export declare class QueryEarningsAggregationDto {
    startDate?: string;
    endDate?: string;
    status?: CommissionStatus;
}
