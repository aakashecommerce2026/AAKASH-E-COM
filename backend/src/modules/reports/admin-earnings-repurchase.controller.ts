import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MemberRole } from '@prisma/client';
import { ReportsService } from './reports.service';
import { QueryAdminRepurchaseEarningsDto } from './dto/query-admin-repurchase-earnings.dto';
import { QueryEarningsAggregationDto } from './dto/query-earnings-aggregation.dto';
import { QueryMemberWiseEarningsDto } from './dto/query-member-wise-earnings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Admin Repurchase Earnings Reports')
@Controller('admin/earnings/repurchase')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(MemberRole.ADMIN, MemberRole.SUB_ADMIN)
@ApiBearerAuth()
export class AdminEarningsRepurchaseController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  @ApiOperation({
    summary: 'GET /admin/earnings/repurchase — List repurchase earnings with filters & summary',
    description:
      'Lists repurchase commission ledgers filtered by date range, memberId, level, status, or source/beneficiary member.',
  })
  @ApiResponse({ status: 200, description: 'Paginated repurchase earnings report with summary totals' })
  async getAdminRepurchaseEarnings(@Query() query: QueryAdminRepurchaseEarningsDto) {
    return this.reportsService.getAdminRepurchaseEarnings(query);
  }

  @Get('level-wise')
  @ApiOperation({
    summary: 'GET /admin/earnings/repurchase/level-wise — Level-wise repurchase earnings aggregation',
    description:
      'Returns level-wise breakdown of gross payouts, pending, hold, disbursed, and cancelled amounts across levels 1 to 20.',
  })
  @ApiResponse({ status: 200, description: '20-level repurchase earnings aggregation array' })
  async getLevelWiseRepurchaseEarnings(@Query() query: QueryEarningsAggregationDto) {
    return this.reportsService.getLevelWiseRepurchaseEarnings(query);
  }

  @Get('member-wise')
  @ApiOperation({
    summary: 'GET /admin/earnings/repurchase/member-wise — Member-wise repurchase earnings aggregation',
    description:
      'Returns aggregated repurchase earnings grouped by beneficiary member, sorted by highest gross earnings.',
  })
  @ApiResponse({ status: 200, description: 'Paginated member-wise repurchase earnings aggregation' })
  async getMemberWiseRepurchaseEarnings(@Query() query: QueryMemberWiseEarningsDto) {
    return this.reportsService.getMemberWiseRepurchaseEarnings(query);
  }
}
