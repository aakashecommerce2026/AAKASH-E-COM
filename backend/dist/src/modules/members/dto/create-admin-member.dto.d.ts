import { MemberRole, MemberStatus } from '@prisma/client';
import { BankDetailsDto } from './bank-details.dto';
export declare class CreateAdminMemberDto {
    memberCode?: string;
    name: string;
    mobile: string;
    email?: string;
    address?: string;
    referrerId?: string;
    upiId?: string;
    bankDetails?: BankDetailsDto;
    status?: MemberStatus;
    password?: string;
    role?: MemberRole;
}
