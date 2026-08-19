import type { Job } from 'bull';
import { AdminReportsService, PeriodType } from './admin-reports.service';
import { PdfExportService } from './pdf-export.service';
import { ExcelExportService } from './excel-export.service';
import { ReportType } from './dto/query-period-report.dto';
export interface ReportExportJobData {
    jobId: string;
    format: 'pdf' | 'excel';
    type: ReportType;
    period: PeriodType;
    query: any;
}
export declare class ReportExportProcessor {
    private readonly adminReportsService;
    private readonly pdfExportService;
    private readonly excelExportService;
    private readonly logger;
    private readonly exportsDir;
    constructor(adminReportsService: AdminReportsService, pdfExportService: PdfExportService, excelExportService: ExcelExportService);
    handleReportExport(job: Job<ReportExportJobData>): Promise<{
        jobId: string;
        filename: string;
        filePath: string;
        format: "pdf" | "excel";
        downloadUrl: string;
        completedAt: string;
    }>;
}
