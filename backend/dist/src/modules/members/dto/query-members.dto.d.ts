import { MemberRole, MemberStatus } from '@prisma/client';
export declare class QueryMembersDto {
    page?: number;
    limit?: number;
    search?: string;
    status?: MemberStatus;
    role?: MemberRole;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
