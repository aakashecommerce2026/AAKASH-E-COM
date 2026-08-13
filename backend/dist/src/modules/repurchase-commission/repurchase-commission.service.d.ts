import { OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { RepurchaseCommissionConfigResponseDto, UpdateRepurchaseCommissionConfigDto } from './dto/repurchase-commission-config.dto';
import { CommissionStatus, Prisma } from '@prisma/client';
export declare const DEFAULT_REPURCHASE_COMMISSION_RATES: {
    level: number;
    percentage: number;
    description: string;
}[];
export interface RepurchaseCommissionLedgerResponseDto {
    id: string;
    repurchaseEntryId: string;
    sourceMemberId: string;
    beneficiaryMemberId: string;
    level: number;
    percentage: number;
    amount: number;
    status: CommissionStatus;
    createdAt: Date;
    updatedAt: Date;
}
export declare class RepurchaseCommissionService implements OnModuleInit {
    private readonly prisma;
    private readonly auditService;
    private readonly logger;
    constructor(prisma: PrismaService, auditService: AuditService);
    onModuleInit(): Promise<void>;
    validateStartupConfig(): Promise<void>;
    getActiveConfig(version?: number, txClient?: Prisma.TransactionClient): Promise<RepurchaseCommissionConfigResponseDto[]>;
    calculateForEntry(repurchaseEntryId: string, txClient?: Prisma.TransactionClient): Promise<RepurchaseCommissionLedgerResponseDto[]>;
    validateRatesSum(rates: {
        level: number;
        percentage: number;
    }[]): void;
    updateConfig(dto: UpdateRepurchaseCommissionConfigDto, actorId?: string): Promise<any>;
    private mapLedgerToDto;
}
