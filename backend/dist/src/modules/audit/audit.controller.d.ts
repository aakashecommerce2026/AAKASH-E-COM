import { AuditService } from './audit.service';
import { QueryAuditLogsDto } from './dto/query-audit-logs.dto';
export declare class AuditController {
    private readonly auditService;
    constructor(auditService: AuditService);
    getAuditLogs(query: QueryAuditLogsDto): Promise<{
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
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
        })[];
        meta: {
            total: number;
            page: any;
            limit: any;
            totalPages: number;
        };
    }>;
}
