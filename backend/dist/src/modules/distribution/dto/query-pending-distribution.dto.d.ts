export declare class QueryPendingDistributionDto {
    startDate?: string;
    endDate?: string;
    memberId?: string;
    commissionType?: 'MEMBERSHIP' | 'REPURCHASE' | 'ALL';
    page?: number;
    limit?: number;
}
