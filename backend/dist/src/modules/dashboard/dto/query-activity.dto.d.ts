export declare enum ActivityCategory {
    ALL = "ALL",
    MEMBER_REGISTRATION = "MEMBER_REGISTRATION",
    REPURCHASE = "REPURCHASE",
    DISTRIBUTION = "DISTRIBUTION",
    SYSTEM_ACTIVITY = "SYSTEM_ACTIVITY"
}
export declare class QueryActivityDto {
    type?: ActivityCategory;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
    refresh?: boolean;
}
