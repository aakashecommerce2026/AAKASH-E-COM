import { PrismaService } from '../../prisma/prisma.service';
import { MemberRole, Prisma } from '@prisma/client';
import { DashboardCacheService } from '../dashboard/dashboard-cache.service';
export interface LogActionParams {
    actorId?: string | null;
    actorRole?: MemberRole | null;
    actionType: string;
    entityType: string;
    entityId?: string | null;
    metadata?: Record<string, any> | null;
}
export declare class AuditService {
    private readonly prisma;
    private readonly dashboardCacheService?;
    private readonly logger;
    constructor(prisma: PrismaService, dashboardCacheService?: DashboardCacheService | undefined);
    logAction(params: LogActionParams, txClient?: Prisma.TransactionClient): Promise<any>;
    getAuditLogs(query: Record<string, any>): Promise<{
        data: ({
            actor: {
                id: string;
                memberCode: string;
                name: string;
                role: import("@prisma/client").$Enums.MemberRole;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            actorId: string | null;
            actorRole: import("@prisma/client").$Enums.MemberRole | null;
            actionType: string;
            entityType: string;
            entityId: string | null;
            metadata: Prisma.JsonValue | null;
        })[];
        meta: {
            total: number;
            page: any;
            limit: any;
            totalPages: number;
        };
    }>;
}
