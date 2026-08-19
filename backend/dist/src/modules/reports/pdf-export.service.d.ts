import { PeriodType } from './admin-reports.service';
import { ReportType } from './dto/query-period-report.dto';
export declare class PdfExportService {
    private readonly logger;
    generateReportPdf(reportType: ReportType, period: PeriodType, reportData: any): Promise<Buffer>;
}
