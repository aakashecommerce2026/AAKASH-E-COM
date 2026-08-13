import { RepurchaseService } from './repurchase.service';
import { CreateRepurchaseEntryDto } from './dto/create-repurchase-entry.dto';
import { UpdateRepurchaseEntryDto } from './dto/update-repurchase-entry.dto';
import { QueryRepurchaseEntryDto } from './dto/query-repurchase-entry.dto';
export declare class RepurchaseController {
    private readonly repurchaseService;
    constructor(repurchaseService: RepurchaseService);
    create(dto: CreateRepurchaseEntryDto, actorId: string): Promise<{
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
    }>;
    findAll(query: QueryRepurchaseEntryDto): Promise<{
        data: {
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
        }[];
        meta: {
            total: number;
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
    }>;
    update(id: string, dto: UpdateRepurchaseEntryDto, actorId: string): Promise<{
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
    }>;
    remove(id: string, actorId: string): Promise<{
        message: string;
    }>;
}
