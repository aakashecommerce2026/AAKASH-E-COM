import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
export interface NotifyDistributionParams {
    memberId: string;
    memberCode: string;
    memberName: string;
    mobile?: string | null;
    email?: string | null;
    batchNo: string;
    grossAmount: number;
    tdsAmount: number;
    adminFee: number;
    netAmount: number;
    channels?: ('EMAIL' | 'SMS' | 'IN_APP')[];
}
export declare class NotificationsService {
    private readonly prisma;
    private readonly auditService;
    private readonly logger;
    constructor(prisma: PrismaService, auditService: AuditService);
    notifyMemberCommissionDistributed(params: NotifyDistributionParams): Promise<void>;
}
