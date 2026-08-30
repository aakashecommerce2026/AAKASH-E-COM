import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
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

@Processor('reports-export')
export class ReportExportProcessor {
  private readonly logger = new Logger(ReportExportProcessor.name);

  constructor(
    private readonly adminReportsService: AdminReportsService,
    private readonly pdfExportService: ReportPdfExportService,
    private readonly excelExportService: ReportExcelExportService,
  ) {}

  @Process('generate-export')
  async handleGenerateExport(job: Job<ReportExportJobData>) {
    this.logger.log(
      `Processing report export job ${job.id} (${job.data.format.toUpperCase()} - ${job.data.type})`,
    );

    const { format, period, type, startDate, endDate } = job.data;

    const reportData = await this.adminReportsService.getPeriodReport(period, {
      type,
      startDate,
      endDate,
    });

    let buffer: Buffer;
    if (format === 'pdf') {
      buffer = await this.pdfExportService.generatePdf(
        reportData,
        period,
        type,
      );
    } else {
      buffer = await this.excelExportService.generateExcel(
        reportData,
        period,
        type,
      );
    }

    this.logger.log(
      `Export job ${job.id} completed. Generated ${buffer.length} bytes.`,
    );

    return {
      status: 'COMPLETED',
      format,
      period,
      type,
      sizeBytes: buffer.length,
      generatedAt: new Date().toISOString(),
      // Base64 encoded result payload for retrieval via GET /admin/reports/export/jobs/:id
      base64Content: buffer.toString('base64'),
    };
  }
}
