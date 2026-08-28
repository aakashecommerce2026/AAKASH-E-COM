import { MemberRole } from '@prisma/client';
import { DistributionService } from './distribution.service';
import { QueryPendingDistributionDto } from './dto/query-pending-distribution.dto';
import { ProcessDistributionBatchDto } from './dto/process-distribution-batch.dto';
import { QueryDistributionHistoryDto } from './dto/query-distribution-history.dto';
export declare class AdminDistributionController {
    private readonly distributionService;
    constructor(distributionService: DistributionService);
    getPendingCommissions(query: QueryPendingDistributionDto): Promise<{
        data: {
            member: any;
            membershipPendingCount: number;
            membershipGrossAmount: number;
            repurchasePendingCount: number;
            repurchaseGrossAmount: number;
            totalLedgerCount: number;
            grossAmount: number;
            tdsAmount: number;
            adminFee: number;
            netAmount: number;
            membershipLedgerIds: any[];
            repurchaseLedgerIds: any[];
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
        summary: {
            totalBeneficiaries: number;
            totalGrossAmount: number;
            totalTdsAmount: number;
            totalAdminFee: number;
            totalNetAmount: number;
        };
    }>;
    processBatch(dto: ProcessDistributionBatchDto, actorId: string, actorRole: MemberRole): Promise<{
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
    } | {
        id: any;
        batchNo: any;
        status: "INITIATED";
        message: string;
        processedBy: any;
        createdAt: any;
    }>;
    getBatchHistory(query: QueryDistributionHistoryDto): Promise<{
        data: {
            id: string;
            batchNo: string;
            totalMembers: number;
            totalGrossAmount: number;
            totalTdsAmount: number;
            totalAdminFee: number;
            totalNetAmount: number;
            status: import("@prisma/client").$Enums.DistributionBatchStatus;
            processedBy: string | null;
            processor: {
                id: string;
                name: string;
                memberCode: string;
            } | null;
            startedAt: Date | null;
            completedAt: Date | null;
            createdAt: Date;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getBatchById(batchId: string): Promise<{
        id: any;
        batchNo: any;
        totalMembers: any;
        totalGrossAmount: number;
        totalTdsAmount: number;
        totalAdminFee: number;
        totalNetAmount: number;
        status: any;
        processedBy: any;
        processor: any;
        remarks: any;
        startedAt: any;
        completedAt: any;
        createdAt: any;
        records: any;
    }>;
}
