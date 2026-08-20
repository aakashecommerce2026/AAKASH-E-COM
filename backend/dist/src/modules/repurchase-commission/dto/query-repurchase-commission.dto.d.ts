import { CommissionStatus } from '@prisma/client';
export declare class QueryRepurchaseCommissionDto {
    page?: number;
    limit?: number;
    repurchaseEntryId?: string;
    sourceMemberId?: string;
    beneficiaryMemberId?: string;
    level?: number;
    status?: CommissionStatus;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
