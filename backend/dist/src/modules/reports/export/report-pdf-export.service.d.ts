import { ExportPeriodType } from '../dto/query-export-report.dto';
export declare class ReportPdfExportService {
    generatePdf(reportData: any, period: ExportPeriodType, reportType: string): Promise<Buffer>;
}
