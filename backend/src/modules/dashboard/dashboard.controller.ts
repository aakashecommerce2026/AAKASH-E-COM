import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MemberRole } from '@prisma/client';
import { DashboardService } from './dashboard.service';
import { QueryDashboardDto } from './dto/query-dashboard.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Admin Dashboard Aggregations')
@Controller('admin/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(MemberRole.ADMIN, MemberRole.SUB_ADMIN)
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('members')
  @ApiOperation({
    summary: 'GET /admin/dashboard/members — Total members, joined today/week/month (date-truncated queries)',
    description:
      'Provides aggregated member counts, date-truncated registration stats for today/this week/this month, status breakdown, and daily trends.',
  })
  @ApiResponse({ status: 200, description: 'Member aggregation statistics returned successfully' })
  async getMemberStats(@Query() query: QueryDashboardDto) {
    return this.dashboardService.getMemberStats(query);
  }

  @Get('earnings')
  @ApiOperation({
    summary: 'GET /admin/dashboard/earnings — Total membership/repurchase earnings, total distributed, pending distributions',
    description:
      'Provides total membership commission earnings, repurchase commission earnings, total distributed net payout, and pending distribution metrics.',
  })
  @ApiResponse({ status: 200, description: 'Earnings aggregation statistics returned successfully' })
  async getEarningsStats(@Query() query: QueryDashboardDto) {
    return this.dashboardService.getEarningsStats(query);
  }

  @Get('business')
  @ApiOperation({
    summary: 'GET /admin/dashboard/business — Repurchase summary, growth summary, earnings summary combined view',
    description:
      'Provides unified business executive dashboard view combining repurchase metrics, growth metrics, and earnings/distribution metrics.',
  })
  @ApiResponse({ status: 200, description: 'Combined business overview statistics returned successfully' })
  async getBusinessStats(@Query() query: QueryDashboardDto) {
    return this.dashboardService.getBusinessStats(query);
  }
}
