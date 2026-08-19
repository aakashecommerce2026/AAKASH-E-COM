export declare enum MemberActivityCategory {
    ALL = "ALL",
    EARNINGS = "EARNINGS",
    REPURCHASE = "REPURCHASE",
    DISTRIBUTION = "DISTRIBUTION",
    SYSTEM = "SYSTEM"
}
export declare class QueryMemberActivityDto {
    category?: MemberActivityCategory;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
}
