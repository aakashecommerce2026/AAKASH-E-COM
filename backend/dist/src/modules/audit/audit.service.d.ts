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
}
