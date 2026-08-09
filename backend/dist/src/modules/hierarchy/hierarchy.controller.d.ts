import { HierarchyService } from './hierarchy.service';
import { GetHierarchyQueryDto } from './dto/get-hierarchy-query.dto';
export declare class HierarchyController {
    private readonly hierarchyService;
    constructor(hierarchyService: HierarchyService);
    getDownline(memberId: string, query: GetHierarchyQueryDto): Promise<import("./interfaces/hierarchy-node.interface").HierarchyNode[]>;
    getDirectReferrals(memberId: string): Promise<import("./interfaces/hierarchy-node.interface").HierarchyNode[]>;
    getUpline(memberId: string, query: GetHierarchyQueryDto): Promise<import("./interfaces/hierarchy-node.interface").HierarchyNode[]>;
}
