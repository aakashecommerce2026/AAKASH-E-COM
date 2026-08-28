import { PrismaService } from '../../prisma/prisma.service';
import { HierarchyNode } from './interfaces/hierarchy-node.interface';
import { SearchDownlineQueryDto } from './dto/search-downline-query.dto';
import { NetworkGrowthQueryDto } from './dto/network-growth-query.dto';
import { NetworkGrowthPoint, BranchCountNode, HierarchySummary } from './interfaces/network-analytics.interface';
export declare class HierarchyService {
    private readonly prisma;
    private readonly ABSOLUTE_MAX_LEVELS_CAP;
    constructor(prisma: PrismaService);
    getDownline(memberId: string, maxLevels?: number, includeSelf?: boolean): Promise<HierarchyNode[]>;
    getUpline(memberId: string, maxLevels?: number): Promise<HierarchyNode[]>;
    searchDownline(memberId: string, queryDto: SearchDownlineQueryDto): Promise<HierarchyNode[]>;
    getNetworkGrowth(memberId: string, queryDto: NetworkGrowthQueryDto): Promise<NetworkGrowthPoint[]>;
    getBranchCounts(memberId: string, maxLevels?: number): Promise<BranchCountNode[]>;
    getTotalDownlineCount(memberId: string, maxLevels?: number): Promise<{
        total: number;
        active: number;
        inactive: number;
        blocked: number;
        pending: number;
    }>;
    getHierarchySummary(memberId: string, maxLevels?: number): Promise<HierarchySummary>;
    isInDownlineOf(memberId: string, targetId: string): Promise<boolean>;
    isMemberInDownline(rootMemberId: string, targetMemberId: string): Promise<boolean>;
}
