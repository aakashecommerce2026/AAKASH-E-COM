import { RepurchaseCommissionService } from './repurchase-commission.service';
import { UpdateRepurchaseCommissionConfigDto, RepurchaseCommissionConfigResponseDto } from './dto/repurchase-commission-config.dto';
import { QueryRepurchaseCommissionDto } from './dto/query-repurchase-commission.dto';
export declare class RepurchaseCommissionController {
    private readonly repurchaseCommissionService;
    constructor(repurchaseCommissionService: RepurchaseCommissionService);
    getConfig(version?: number): Promise<RepurchaseCommissionConfigResponseDto[]>;
    updateConfig(dto: UpdateRepurchaseCommissionConfigDto, actorId: string): Promise<RepurchaseCommissionConfigResponseDto[]>;
    findAll(query: QueryRepurchaseCommissionDto): Promise<{
        data: {
            repurchaseEntry: {
                id: string;
                amount: import("@prisma/client/runtime/library").Decimal;
                transactionRef: string;
                transactionDate: Date;
            };
            sourceMember: {
                id: string;
                memberCode: string;
                name: string;
                mobile: string;
            };
            beneficiaryMember: {
                id: string;
                memberCode: string;
                name: string;
                mobile: string;
            };
            id: string;
            repurchaseEntryId: string;
            sourceMemberId: string;
            beneficiaryMemberId: string;
            level: number;
            percentage: number;
            amount: number;
            status: import("@prisma/client").CommissionStatus;
            createdAt: Date;
            updatedAt: Date;
        }[];
        meta: {
            total: number;
            page: any;
            limit: any;
            totalPages: number;
        };
    }>;
    findById(id: string): Promise<any>;
    triggerRepurchaseCommission(repurchaseEntryId: string): Promise<import("./repurchase-commission.service").RepurchaseCommissionLedgerResponseDto[]>;
}
