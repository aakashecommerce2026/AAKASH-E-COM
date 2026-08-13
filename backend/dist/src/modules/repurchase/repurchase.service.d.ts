import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { RepurchaseCommissionService } from '../repurchase-commission/repurchase-commission.service';
import { CreateRepurchaseEntryDto } from './dto/create-repurchase-entry.dto';
import { UpdateRepurchaseEntryDto } from './dto/update-repurchase-entry.dto';
import { QueryRepurchaseEntryDto } from './dto/query-repurchase-entry.dto';
import { MemberRole } from '@prisma/client';
export declare class RepurchaseService {
    private readonly prisma;
    private readonly auditService;
    private readonly repurchaseCommissionService;
    constructor(prisma: PrismaService, auditService: AuditService, repurchaseCommissionService: RepurchaseCommissionService);
    private hasCommissionsGenerated;
    create(dto: CreateRepurchaseEntryDto, actorId?: string, actorRole?: MemberRole): Promise<{
        id: any;
        transactionRef: any;
        memberId: any;
        member: any;
        amount: number;
        transactionDate: any;
        remarks: any;
        createdBy: any;
        createdAt: any;
        updatedAt: any;
        deletedAt: any;
    }>;
    findAll(query: QueryRepurchaseEntryDto): Promise<{
        data: any;
        meta: {
            total: any;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findById(id: string): Promise<{
        id: any;
        transactionRef: any;
        memberId: any;
        member: any;
        amount: number;
        transactionDate: any;
        remarks: any;
        createdBy: any;
        createdAt: any;
        updatedAt: any;
        deletedAt: any;
    }>;
    update(id: string, dto: UpdateRepurchaseEntryDto, actorId?: string, actorRole?: MemberRole): Promise<{
        id: any;
        transactionRef: any;
        memberId: any;
        member: any;
        amount: number;
        transactionDate: any;
        remarks: any;
        createdBy: any;
        createdAt: any;
        updatedAt: any;
        deletedAt: any;
    }>;
    remove(id: string, actorId?: string, actorRole?: MemberRole): Promise<{
        message: string;
    }>;
    private mapToResponseDto;
}
