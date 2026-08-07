import { CommissionStatus } from '@prisma/client';
export declare class CreateMembershipCommissionDto {
    sourceMemberId: string;
    beneficiaryMemberId: string;
    level: number;
    percentage: number;
    amount: number;
    status?: CommissionStatus;
}
