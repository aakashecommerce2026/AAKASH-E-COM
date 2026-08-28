import { RepurchaseService } from './repurchase.service';
import { QueryRepurchaseEntryDto } from './dto/query-repurchase-entry.dto';
export declare class MemberRepurchaseController {
    private readonly repurchaseService;
    constructor(repurchaseService: RepurchaseService);
    getMyRepurchases(memberId: string, query: QueryRepurchaseEntryDto): Promise<{
        data: any;
        meta: {
            total: any;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
}
