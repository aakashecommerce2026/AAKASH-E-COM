import { MemberRole, MemberStatus } from '@prisma/client';
import { BankDetailsDto } from './bank-details.dto';
export declare class MemberResponseDto {
    id: string;
    memberCode: string;
    name: string;
    mobile: string;
    email?: string | null;
    address?: string | null;
    referrerId?: string | null;
    joiningDate: Date;
    upiId?: string | null;
    bankDetails?: BankDetailsDto | null;
    status: MemberStatus;
    role: MemberRole;
    createdAt: Date;
    updatedAt: Date;
}
