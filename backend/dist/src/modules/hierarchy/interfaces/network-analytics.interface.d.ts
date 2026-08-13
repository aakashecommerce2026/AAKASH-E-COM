export interface NetworkGrowthPoint {
    period: string;
    level: number;
    joinCount: number;
}
export interface BranchCountNode {
    branchRootId: string;
    branchRootCode: string;
    branchRootName: string;
    status: string;
    totalDownlineInBranch: number;
    activeMembersInBranch: number;
}
export interface HierarchySummary {
    memberId: string;
    memberCode: string;
    memberName: string;
    totalDownline: number;
    activeDownline: number;
    inactiveDownline: number;
    totalBranches: number;
    branches: BranchCountNode[];
    levelBreakdown: Array<{
        level: number;
        totalCount: number;
        activeCount: number;
    }>;
}
