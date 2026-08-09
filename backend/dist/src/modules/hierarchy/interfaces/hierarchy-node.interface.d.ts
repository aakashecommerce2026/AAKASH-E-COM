export interface HierarchyNode {
    id: string;
    memberCode: string;
    name: string;
    mobile: string;
    email: string | null;
    referrerId: string | null;
    joiningDate: Date;
    status: string;
    role: string;
    level: number;
}
