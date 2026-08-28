import type { Job } from 'bull';
import { AdminReportsService } from '../admin-reports.service';
import { ReportPdfExportService } from './report-pdf-export.service';
import { ReportExcelExportService } from './report-excel-export.service';
import { ExportPeriodType } from '../dto/query-export-report.dto';
export interface ReportExportJobData {
    format: 'pdf' | 'excel';
    period: ExportPeriodType;
    type: any;
    startDate?: string;
    endDate?: string;
}
export declare class ReportExportProcessor {
    private readonly adminReportsService;
    private readonly pdfExportService;
    private readonly excelExportService;
    private readonly logger;
    constructor(adminReportsService: AdminReportsService, pdfExportService: ReportPdfExportService, excelExportService: ReportExcelExportService);
    handleGenerateExport(job: Job<ReportExportJobData>): Promise<{
        status: string;
        format: "pdf" | "excel";
        period: ExportPeriodType;
        type: any;
        sizeBytes: number;
        generatedAt: string;
        base64Content: string;
    }>;
}
