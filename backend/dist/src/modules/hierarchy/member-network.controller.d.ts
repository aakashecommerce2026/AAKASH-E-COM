import { HierarchyService } from './hierarchy.service';
import { GetHierarchyQueryDto } from './dto/get-hierarchy-query.dto';
import { SearchDownlineQueryDto } from './dto/search-downline-query.dto';
export declare class MemberNetworkController {
    private readonly hierarchyService;
    constructor(hierarchyService: HierarchyService);
    getDirectReferrals(memberId: string): Promise<import("./interfaces/hierarchy-node.interface").HierarchyNode[]>;
    getDownline(memberId: string, query: GetHierarchyQueryDto): Promise<import("./interfaces/hierarchy-node.interface").HierarchyNode[]>;
    getNetworkSummary(memberId: string, query: GetHierarchyQueryDto): Promise<import("./interfaces/network-analytics.interface").HierarchySummary>;
    searchDownline(memberId: string, query: SearchDownlineQueryDto): Promise<import("./interfaces/hierarchy-node.interface").HierarchyNode[]>;
}
