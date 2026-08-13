import { MemberRole } from '@prisma/client';
import { RepurchaseService } from './repurchase.service';
import { CreateRepurchaseEntryDto } from './dto/create-repurchase-entry.dto';
import { UpdateRepurchaseEntryDto } from './dto/update-repurchase-entry.dto';
import { QueryRepurchaseEntryDto } from './dto/query-repurchase-entry.dto';
export declare class AdminRepurchaseController {
    private readonly repurchaseService;
    constructor(repurchaseService: RepurchaseService);
    create(dto: CreateRepurchaseEntryDto, actorId: string, actorRole: MemberRole): Promise<{
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
    update(id: string, dto: UpdateRepurchaseEntryDto, actorId: string, actorRole: MemberRole): Promise<{
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
    remove(id: string, actorId: string, actorRole: MemberRole): Promise<{
        message: string;
    }>;
}
