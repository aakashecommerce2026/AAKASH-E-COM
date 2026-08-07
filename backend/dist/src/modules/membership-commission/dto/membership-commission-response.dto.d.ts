import { CommissionStatus } from '@prisma/client';
export declare class MembershipCommissionResponseDto {
    id: string;
    sourceMemberId: string;
    beneficiaryMemberId: string;
    level: number;
    percentage: number | string;
    amount: number | string;
    status: CommissionStatus;
    createdAt: Date;
    updatedAt: Date;
}
