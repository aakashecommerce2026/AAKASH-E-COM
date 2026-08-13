import { CommissionStatus } from '@prisma/client';
export declare class QueryAdminRepurchaseEarningsDto {
    startDate?: string;
    endDate?: string;
    memberId?: string;
    beneficiaryMemberId?: string;
    sourceMemberId?: string;
    level?: number;
    status?: CommissionStatus;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
