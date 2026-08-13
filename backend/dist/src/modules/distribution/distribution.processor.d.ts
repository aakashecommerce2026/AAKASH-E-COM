import type { Job } from 'bull';
import { DistributionService } from './distribution.service';
export interface DistributionJobData {
    batchId: string;
    cutoffDate?: string;
    membershipLedgerIds?: string[];
    repurchaseLedgerIds?: string[];
    memberIds?: string[];
    remarks?: string;
    actorId?: string;
    actorRole?: any;
}
export declare class DistributionProcessor {
    private readonly distributionService;
    private readonly logger;
    constructor(distributionService: DistributionService);
    handleDistributionBatch(job: Job<DistributionJobData>): Promise<{
        id: any;
        batchNo: any;
        totalMembers: any;
        totalGrossAmount: number;
        totalTdsAmount: number;
        totalAdminFee: number;
        totalNetAmount: number;
        status: any;
        processedBy: any;
        startedAt: any;
        completedAt: any;
        records: any;
    }>;
}
