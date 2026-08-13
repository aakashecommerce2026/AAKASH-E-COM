export declare enum NetworkGrowthGroupBy {
    WEEK = "week",
    MONTH = "month"
}
export declare class NetworkGrowthQueryDto {
    groupBy?: NetworkGrowthGroupBy;
    maxLevels?: number;
    startDate?: string;
    endDate?: string;
}
