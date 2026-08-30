import {
  Controller,
  Get,
  Query,
  Param,
  Res,
  UseGuards,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MemberRole } from '@prisma/client';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { AdminReportsService } from './admin-reports.service';
import { ReportPdfExportService } from './export/report-pdf-export.service';
import { ReportExcelExportService } from './export/report-excel-export.service';
import { QueryExportReportDto } from './dto/query-export-report.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Admin Reports Export')
@Controller('admin/reports/export')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(MemberRole.ADMIN, MemberRole.SUB_ADMIN)
@ApiBearerAuth()
export class AdminReportsExportController {
  constructor(
    private readonly adminReportsService: AdminReportsService,
    private readonly pdfExportService: ReportPdfExportService,
    private readonly excelExportService: ReportExcelExportService,
    @InjectQueue('reports-export') private readonly reportsExportQueue: Queue,
  ) {}

  @Get('pdf')
  @ApiOperation({
    summary:
      'GET /admin/reports/export/pdf — Export daily/weekly/monthly report to PDF',
    description:
      'Generates a PDF document for member registrations, repurchase activities, earnings summary, or business summary.',
  })
  @ApiResponse({
    status: 200,
    description: 'PDF file binary or queue job reference',
  })
  async exportPdf(@Query() query: QueryExportReportDto, @Res() res: Response) {
    const period = query.period || 'daily';

    if (query.async) {
      const job = await this.reportsExportQueue.add('generate-export', {
        format: 'pdf',
        period,
        type: query.type,
        startDate: query.startDate,
        endDate: query.endDate,
      });

      return res.status(202).json({
        jobId: job.id,
        status: 'QUEUED',
        message:
          'Report export job queued. Download link available upon completion at GET /admin/reports/export/jobs/' +
          job.id,
      });
    }

    const reportData = await this.adminReportsService.getPeriodReport(period, {
      type: query.type,
      startDate: query.startDate,
      endDate: query.endDate,
    });

    const pdfBuffer = await this.pdfExportService.generatePdf(
      reportData,
      period,
      query.type,
    );

    const filename = `${query.type}-${period}-${new Date().toISOString().split('T')[0]}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(pdfBuffer);
  }

  @Get('excel')
  @ApiOperation({
    summary:
      'GET /admin/reports/export/excel — Export daily/weekly/monthly report to Excel (.xlsx)',
    description:
      'Generates an Excel workbook with formatted headers matching the report type and period breakdown.',
  })
  @ApiResponse({
    status: 200,
    description: 'Excel .xlsx file binary or queue job reference',
  })
  async exportExcel(
    @Query() query: QueryExportReportDto,
    @Res() res: Response,
  ) {
    const period = query.period || 'daily';

    if (query.async) {
      const job = await this.reportsExportQueue.add('generate-export', {
        format: 'excel',
        period,
        type: query.type,
        startDate: query.startDate,
        endDate: query.endDate,
      });

      return res.status(202).json({
        jobId: job.id,
        status: 'QUEUED',
        message:
          'Report export job queued. Download link available upon completion at GET /admin/reports/export/jobs/' +
          job.id,
      });
    }

    const reportData = await this.adminReportsService.getPeriodReport(period, {
      type: query.type,
      startDate: query.startDate,
      endDate: query.endDate,
    });

    const excelBuffer = await this.excelExportService.generateExcel(
      reportData,
      period,
      query.type,
    );

    const filename = `${query.type}-${period}-${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(excelBuffer);
  }

  @Get('jobs/:id')
  @ApiOperation({
    summary:
      'GET /admin/reports/export/jobs/:id — Check export queue job status or download result',
  })
  @ApiResponse({ status: 200, description: 'Export job status and payload' })
  async getJobStatus(@Param('id') id: string, @Res() res: Response) {
    const job = await this.reportsExportQueue.getJob(id);
    if (!job) {
      throw new NotFoundException(`Export job with ID '${id}' not found`);
    }

    const state = await job.getState();
    const progress = job.progress();

    if (state === 'completed') {
      return res.json({
        id: job.id,
        status: 'COMPLETED',
        progress: 100,
        result: job.returnvalue,
      });
    }

    return res.json({
      id: job.id,
      status: state.toUpperCase(),
      progress,
      failedReason: job.failedReason || null,
    });
  }
}
