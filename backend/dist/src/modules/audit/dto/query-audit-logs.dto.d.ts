import { MemberRole } from '@prisma/client';
export declare class QueryAuditLogsDto {
    actorId?: string;
    actorRole?: MemberRole;
    actionType?: string;
    entityType?: string;
    entityId?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
