import { PrismaService } from '../../prisma/prisma.service';
import { MemberRole } from '@prisma/client';
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
    logAction(params: LogActionParams): Promise<{
        id: string;
        createdAt: Date;
        actorRole: import("@prisma/client").$Enums.MemberRole | null;
        actionType: string;
        entityType: string;
        entityId: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        actorId: string | null;
    } | undefined>;
}
