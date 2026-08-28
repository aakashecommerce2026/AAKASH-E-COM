import { ExportPeriodType } from '../dto/query-export-report.dto';
export declare class ReportExcelExportService {
    generateExcel(reportData: any, period: ExportPeriodType, reportType: string): Promise<Buffer>;
}
