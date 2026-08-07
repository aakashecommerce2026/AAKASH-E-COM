import { CommissionStatus } from '@prisma/client';
export declare class RepurchaseCommissionResponseDto {
    id: string;
    repurchaseEntryId: string;
    sourceMemberId: string;
    beneficiaryMemberId: string;
    level: number;
    percentage: number | string;
    amount: number | string;
    status: CommissionStatus;
    createdAt: Date;
    updatedAt: Date;
}
