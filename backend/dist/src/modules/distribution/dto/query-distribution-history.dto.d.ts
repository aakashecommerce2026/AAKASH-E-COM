import { DistributionBatchStatus } from '@prisma/client';
export declare class QueryDistributionHistoryDto {
    startDate?: string;
    endDate?: string;
    status?: DistributionBatchStatus;
    search?: string;
    page?: number;
    limit?: number;
}
