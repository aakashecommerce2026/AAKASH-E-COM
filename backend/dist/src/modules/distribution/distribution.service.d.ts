import type { Queue } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { QueryPendingDistributionDto } from './dto/query-pending-distribution.dto';
import { ProcessDistributionBatchDto } from './dto/process-distribution-batch.dto';
import { QueryDistributionHistoryDto } from './dto/query-distribution-history.dto';
import { MemberRole } from '@prisma/client';
export declare class DistributionService {
    private readonly prisma;
    private readonly auditService;
    private readonly notificationsService;
    private readonly distributionQueue?;
    private readonly logger;
    constructor(prisma: PrismaService, auditService: AuditService, notificationsService: NotificationsService, distributionQueue?: Queue | undefined);
    private buildDateWhere;
    getPendingDistributionSummary(): Promise<{
        pendingMembershipLedgersCount: number;
        pendingRepurchaseLedgersCount: number;
        totalPendingLedgersCount: number;
        membershipGrossAmount: number;
        repurchaseGrossAmount: number;
        totalGrossAmount: number;
    }>;
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
    processDistributionBatch(dto: ProcessDistributionBatchDto, actorId?: string, actorRole?: MemberRole): Promise<{
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
    executeBatchProcessing(batchId: string, dto: ProcessDistributionBatchDto, actorId?: string, actorRole?: MemberRole): Promise<{
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
                memberCode: string;
                name: string;
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
