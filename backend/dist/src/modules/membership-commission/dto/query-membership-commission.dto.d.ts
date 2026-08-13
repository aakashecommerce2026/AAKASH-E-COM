import { CommissionStatus } from '@prisma/client';
export declare class QueryMembershipCommissionDto {
    page?: number;
    limit?: number;
    sourceMemberId?: string;
    beneficiaryMemberId?: string;
    level?: number;
    status?: CommissionStatus;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
