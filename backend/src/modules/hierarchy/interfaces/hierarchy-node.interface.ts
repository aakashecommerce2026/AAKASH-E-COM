export interface HierarchyNode {
  id: string;
  memberCode: string;
  username: string | null;
  name: string;
  mobile: string;
  email: string | null;
  profilePhoto: string | null;
  referrerId: string | null;
  joiningDate: Date;
  status: string;
  role: string;
  level: number;
}
