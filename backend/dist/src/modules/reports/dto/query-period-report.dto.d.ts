export declare enum ReportType {
    MEMBER_REGISTRATIONS = "member-registrations",
    REPURCHASE_ACTIVITIES = "repurchase-activities",
    EARNINGS_SUMMARY = "earnings-summary",
    BUSINESS_SUMMARY = "business-summary"
}
export declare enum PeriodTypeEnum {
    DAILY = "daily",
    WEEKLY = "weekly",
    MONTHLY = "monthly"
}
export declare class QueryPeriodReportDto {
    type?: ReportType;
    period?: PeriodTypeEnum;
    startDate?: string;
    endDate?: string;
    async?: boolean;
    page?: number;
    limit?: number;
}
