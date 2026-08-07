import { CommissionStatus } from '@prisma/client';
export declare class CreateRepurchaseCommissionDto {
    repurchaseEntryId: string;
    sourceMemberId: string;
    beneficiaryMemberId: string;
    level: number;
    percentage: number;
    amount: number;
    status?: CommissionStatus;
}
