import { ReportType } from './query-period-report.dto';
export type ExportPeriodType = 'daily' | 'weekly' | 'monthly';
export declare class QueryExportReportDto {
    type: ReportType;
    period?: ExportPeriodType;
    startDate?: string;
    endDate?: string;
    async?: boolean;
}
