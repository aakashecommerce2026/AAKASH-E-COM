import {
  Controller,
  Get,
  Query,
  Param,
  Res,
  UseGuards,
  Optional,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { MemberRole } from '@prisma/client';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import type { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { AdminReportsService, PeriodType } from './admin-reports.service';
import { PdfExportService } from './pdf-export.service';
import { ExcelExportService } from './excel-export.service';
import { QueryPeriodReportDto, ReportType } from './dto/query-period-report.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Admin Periodic Reports')
@Controller('admin/reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(MemberRole.ADMIN, MemberRole.SUB_ADMIN)
@ApiBearerAuth()
export class AdminReportsController {
  private readonly exportsDir = path.join(process.cwd(), 'exports');

  constructor(
    private readonly adminReportsService: AdminReportsService,
    private readonly pdfExportService: PdfExportService,
    private readonly excelExportService: ExcelExportService,
    @Optional()
    @InjectQueue('report-export-queue')
    private readonly exportQueue?: Queue,
  ) {
    if (!fs.existsSync(this.exportsDir)) {
      fs.mkdirSync(this.exportsDir, { recursive: true });
    }
  }

  @Get('daily')
  @ApiOperation({
    summary:
      'GET /admin/reports/daily — Daily reports for member registrations, repurchase, earnings, or business summary',
    description:
      'Generates daily-bucketed reports for member registrations, repurchase activities, earnings summary, or business summary.',
  })
  @ApiResponse({
    status: 200,
    description: 'Structured JSON daily report output',
  })
  async getDailyReport(@Query() query: QueryPeriodReportDto) {
    return this.adminReportsService.getPeriodReport('daily', query);
  }

  @Get('weekly')
  @ApiOperation({
    summary:
      'GET /admin/reports/weekly — Weekly reports for member registrations, repurchase, earnings, or business summary',
    description:
      'Generates weekly-bucketed reports for member registrations, repurchase activities, earnings summary, or business summary.',
  })
  @ApiResponse({
    status: 200,
    description: 'Structured JSON weekly report output',
  })
  async getWeeklyReport(@Query() query: QueryPeriodReportDto) {
    return this.adminReportsService.getPeriodReport('weekly', query);
  }

  @Get('monthly')
  @ApiOperation({
    summary:
      'GET /admin/reports/monthly — Monthly reports for member registrations, repurchase, earnings, or business summary',
    description:
      'Generates monthly-bucketed reports for member registrations, repurchase activities, earnings summary, or business summary.',
  })
  @ApiResponse({
    status: 200,
    description: 'Structured JSON monthly report output',
  })
  async getMonthlyReport(@Query() query: QueryPeriodReportDto) {
    return this.adminReportsService.getPeriodReport('monthly', query);
  }

  @Get('export/pdf')
  @ApiOperation({
    summary: 'GET /admin/reports/export/pdf — Export reports to PDF format',
    description:
      'Builds a PDF report document using pdf-lib. If async=true, enqueues Bull queue job and returns download link.',
  })
  @ApiResponse({
    status: 200,
    description: 'PDF file binary stream or queued background job details',
  })
  async exportPdf(@Query() query: QueryPeriodReportDto, @Res() res: Response) {
    const period: PeriodType = (query.period as PeriodType) || 'daily';

    if (query.async) {
      return this.handleAsyncExport('pdf', period, query, res);
    }

    const reportType = query.type || ReportType.BUSINESS_SUMMARY;
    const reportData = await this.adminReportsService.getPeriodReport(
      period,
      query,
    );
    const pdfBuffer = await this.pdfExportService.generateReportPdf(
      reportType,
      period,
      reportData,
    );

    const filename = `report_${reportType}_${period}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(pdfBuffer);
  }

  @Get('export/excel')
  @ApiOperation({
    summary:
      'GET /admin/reports/export/excel — Export reports to Excel format using ExcelJS',
    description:
      'Builds an Excel spreadsheet matching report type column headers. If async=true, enqueues Bull queue job.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Excel spreadsheet binary stream or queued background job details',
  })
  async exportExcel(
    @Query() query: QueryPeriodReportDto,
    @Res() res: Response,
  ) {
    const period: PeriodType = (query.period as PeriodType) || 'daily';

    if (query.async) {
      return this.handleAsyncExport('excel', period, query, res);
    }

    const reportType = query.type || ReportType.BUSINESS_SUMMARY;
    const reportData = await this.adminReportsService.getPeriodReport(
      period,
      query,
    );
    const excelBuffer = await this.excelExportService.generateReportExcel(
      reportType,
      period,
      reportData,
    );

    const filename = `report_${reportType}_${period}.xlsx`;
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(excelBuffer);
  }

  @Get('export/status/:jobId')
  @ApiOperation({
    summary:
      'GET /admin/reports/export/status/:jobId — Check background export job status',
    description:
      'Queries status of background report export job dispatched to Bull queue.',
  })
  @ApiParam({
    name: 'jobId',
    description: 'Job ID returned when enqueuing export',
  })
  async getExportStatus(@Param('jobId') jobId: string) {
    if (!this.exportQueue) {
      return {
        jobId,
        status: 'completed',
        message: 'Direct execution mode (Queue offline)',
      };
    }

    const job = await this.exportQueue.getJob(jobId);
    if (!job) {
      throw new NotFoundException(`Export job '${jobId}' not found`);
    }

    const state = await job.getState();
    const returnvalue = job.returnvalue;

    return {
      jobId,
      status: state,
      progress: job.progress(),
      result: returnvalue || null,
      failedReason: job.failedReason || null,
    };
  }

  @Get('export/download/:filename')
  @ApiOperation({
    summary:
      'GET /admin/reports/export/download/:filename — Download generated export file',
    description:
      'Downloads previously generated report export file stored on disk.',
  })
  @ApiParam({ name: 'filename', description: 'Filename of exported report' })
  async downloadExportFile(
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    const safeFilename = path.basename(filename);
    const filePath = path.join(this.exportsDir, safeFilename);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException(
        `Exported file '${safeFilename}' not found or expired`,
      );
    }

    const ext = path.extname(safeFilename).toLowerCase();
    const contentType =
      ext === '.pdf'
        ? 'application/pdf'
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    res.setHeader('Content-Type', contentType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${safeFilename}"`,
    );
    return res.sendFile(filePath);
  }

  private async handleAsyncExport(
    format: 'pdf' | 'excel',
    period: PeriodType,
    query: QueryPeriodReportDto,
    res: Response,
  ) {
    const jobId = `export_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    if (this.exportQueue) {
      try {
        await this.exportQueue.add('generate-report', {
          jobId,
          format,
          type: query.type,
          period,
          query,
        });

        const ext = format === 'pdf' ? 'pdf' : 'xlsx';
        const expectedFilename = `report_${query.type}_${period}_${jobId}.${ext}`;

        return res.status(202).json({
          jobId,
          status: 'queued',
          message:
            'Report export job successfully enqueued for background processing.',
          statusUrl: `/admin/reports/export/status/${jobId}`,
          downloadUrl: `/admin/reports/export/download/${expectedFilename}`,
        });
      } catch (error) {
        // Fallback to synchronous generation if queue fails
      }
    }

    // Direct synchronous fallback
    const reportType = query.type || ReportType.BUSINESS_SUMMARY;
    const reportData = await this.adminReportsService.getPeriodReport(
      period,
      query,
    );
    const buffer =
      format === 'pdf'
        ? await this.pdfExportService.generateReportPdf(
            reportType,
            period,
            reportData,
          )
        : await this.excelExportService.generateReportExcel(
            reportType,
            period,
            reportData,
          );

    const ext = format === 'pdf' ? 'pdf' : 'xlsx';
    const filename = `report_${reportType}_${period}_${jobId}.${ext}`;
    const filePath = path.join(this.exportsDir, filename);
    fs.writeFileSync(filePath, buffer);

    return res.status(200).json({
      jobId,
      status: 'completed',
      message: 'Report generated synchronously.',
      downloadUrl: `/admin/reports/export/download/${filename}`,
    });
  }
}
