import { PeriodType } from './admin-reports.service';
import { ReportType } from './dto/query-period-report.dto';
export declare class ExcelExportService {
    private readonly logger;
    generateReportExcel(reportType: ReportType, period: PeriodType, reportData: any): Promise<Buffer>;
}
