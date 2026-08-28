import type { Response } from 'express';
import type { Queue } from 'bull';
import { AdminReportsService } from './admin-reports.service';
import { ReportPdfExportService } from './export/report-pdf-export.service';
import { ReportExcelExportService } from './export/report-excel-export.service';
import { QueryExportReportDto } from './dto/query-export-report.dto';
export declare class AdminReportsExportController {
    private readonly adminReportsService;
    private readonly pdfExportService;
    private readonly excelExportService;
    private readonly reportsExportQueue;
    constructor(adminReportsService: AdminReportsService, pdfExportService: ReportPdfExportService, excelExportService: ReportExcelExportService, reportsExportQueue: Queue);
    exportPdf(query: QueryExportReportDto, res: Response): Promise<Response<any, Record<string, any>>>;
    exportExcel(query: QueryExportReportDto, res: Response): Promise<Response<any, Record<string, any>>>;
    getJobStatus(id: string, res: Response): Promise<Response<any, Record<string, any>>>;
}
