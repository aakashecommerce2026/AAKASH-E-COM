import { MemberRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
export declare const TDS_DEDUCTIONS_KEY = "TDS_DEDUCTIONS_ENABLED";
export declare class SystemSettingsService {
    private readonly prisma;
    private readonly auditService;
    private readonly logger;
    constructor(prisma: PrismaService, auditService: AuditService);
    isTdsEnabled(): Promise<boolean>;
    setTdsEnabled(enabled: boolean, actorId?: string, actorRole?: MemberRole): Promise<{
        enabled: boolean;
        message: string;
    }>;
}
