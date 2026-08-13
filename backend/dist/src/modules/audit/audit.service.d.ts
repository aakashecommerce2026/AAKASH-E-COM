import { PrismaService } from '../../prisma/prisma.service';
import { MemberRole, Prisma } from '@prisma/client';
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
    private readonly logger;
    constructor(prisma: PrismaService);
    logAction(params: LogActionParams, txClient?: Prisma.TransactionClient): Promise<any>;
}
