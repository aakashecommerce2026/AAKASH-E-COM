import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import * as fs from 'fs';
import * as path from 'path';
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

@Processor('report-export-queue')
export class ReportExportProcessor {
  private readonly logger = new Logger(ReportExportProcessor.name);
  private readonly exportsDir = path.join(process.cwd(), 'exports');

  constructor(
    private readonly adminReportsService: AdminReportsService,
    private readonly pdfExportService: PdfExportService,
    private readonly excelExportService: ExcelExportService,
  ) {
    if (!fs.existsSync(this.exportsDir)) {
      fs.mkdirSync(this.exportsDir, { recursive: true });
    }
  }

  @Process('generate-report')
  async handleReportExport(job: Job<ReportExportJobData>) {
    const { jobId, format, type, period, query } = job.data;
    this.logger.log(
      `Processing background report export job ${job.id} (Type: ${type}, Format: ${format})`,
    );

    // 1. Fetch report data
    const reportData = await this.adminReportsService.getPeriodReport(
      period,
      query,
    );

    // 2. Render report buffer
    let buffer: Buffer;
    let extension: string;

    if (format === 'pdf') {
      buffer = await this.pdfExportService.generateReportPdf(
        type,
        period,
        reportData,
      );
      extension = 'pdf';
    } else {
      buffer = await this.excelExportService.generateReportExcel(
        type,
        period,
        reportData,
      );
      extension = 'xlsx';
    }

    // 3. Write file to exports directory
    const filename = `report_${type}_${period}_${jobId}.${extension}`;
    const filePath = path.join(this.exportsDir, filename);
    fs.writeFileSync(filePath, buffer);

    this.logger.log(
      `Export job ${job.id} completed. Saved file to ${filePath}`,
    );

    return {
      jobId,
      filename,
      filePath,
      format,
      downloadUrl: `/admin/reports/export/download/${filename}`,
      completedAt: new Date().toISOString(),
    };
  }
}
