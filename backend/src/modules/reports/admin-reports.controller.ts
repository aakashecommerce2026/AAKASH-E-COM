import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MemberRole } from '@prisma/client';
import { AdminReportsService } from './admin-reports.service';
import { QueryPeriodReportDto } from './dto/query-period-report.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Admin Periodic Reports')
@Controller('admin/reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(MemberRole.ADMIN, MemberRole.SUB_ADMIN)
@ApiBearerAuth()
export class AdminReportsController {
  constructor(private readonly adminReportsService: AdminReportsService) {}

  @Get('daily')
  @ApiOperation({
    summary: 'GET /admin/reports/daily — Daily reports for member registrations, repurchase, earnings, or business summary',
    description: 'Generates daily-bucketed reports for member registrations, repurchase activities, earnings summary, or business summary.',
  })
  @ApiResponse({ status: 200, description: 'Structured JSON daily report output' })
  async getDailyReport(@Query() query: QueryPeriodReportDto) {
    return this.adminReportsService.getPeriodReport('daily', query);
  }

  @Get('weekly')
  @ApiOperation({
    summary: 'GET /admin/reports/weekly — Weekly reports for member registrations, repurchase, earnings, or business summary',
    description: 'Generates weekly-bucketed reports for member registrations, repurchase activities, earnings summary, or business summary.',
  })
  @ApiResponse({ status: 200, description: 'Structured JSON weekly report output' })
  async getWeeklyReport(@Query() query: QueryPeriodReportDto) {
    return this.adminReportsService.getPeriodReport('weekly', query);
  }

  @Get('monthly')
  @ApiOperation({
    summary: 'GET /admin/reports/monthly — Monthly reports for member registrations, repurchase, earnings, or business summary',
    description: 'Generates monthly-bucketed reports for member registrations, repurchase activities, earnings summary, or business summary.',
  })
  @ApiResponse({ status: 200, description: 'Structured JSON monthly report output' })
  async getMonthlyReport(@Query() query: QueryPeriodReportDto) {
    return this.adminReportsService.getPeriodReport('monthly', query);
  }
}
