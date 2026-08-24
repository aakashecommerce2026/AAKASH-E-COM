import { MemberRole, MemberStatus } from '@prisma/client';
import { BankDetailsDto } from './bank-details.dto';
export declare class CreateMemberDto {
    memberCode: string;
    name: string;
    username?: string;
    mobile: string;
    email?: string;
    address?: string;
    referrerId?: string;
    upiId?: string;
    bankDetails?: BankDetailsDto;
    status?: MemberStatus;
    password: string;
    role?: MemberRole;
    otp?: string;
}
