import { HierarchyService } from './hierarchy.service';
import { GetHierarchyQueryDto } from './dto/get-hierarchy-query.dto';
import { SearchDownlineQueryDto } from './dto/search-downline-query.dto';
import { NetworkGrowthQueryDto } from './dto/network-growth-query.dto';
export declare class HierarchyController {
    private readonly hierarchyService;
    constructor(hierarchyService: HierarchyService);
    getDownline(memberId: string, query: GetHierarchyQueryDto): Promise<import("./interfaces/hierarchy-node.interface").HierarchyNode[]>;
    getDirectReferrals(memberId: string): Promise<import("./interfaces/hierarchy-node.interface").HierarchyNode[]>;
    getUpline(memberId: string, query: GetHierarchyQueryDto): Promise<import("./interfaces/hierarchy-node.interface").HierarchyNode[]>;
    searchDownline(memberId: string, query: SearchDownlineQueryDto): Promise<import("./interfaces/hierarchy-node.interface").HierarchyNode[]>;
    getNetworkGrowth(memberId: string, query: NetworkGrowthQueryDto): Promise<import("./interfaces/network-analytics.interface").NetworkGrowthPoint[]>;
    getBranchCounts(memberId: string, query: GetHierarchyQueryDto): Promise<import("./interfaces/network-analytics.interface").BranchCountNode[]>;
    getHierarchySummary(memberId: string, query: GetHierarchyQueryDto): Promise<import("./interfaces/network-analytics.interface").HierarchySummary>;
}
