import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MemberRole } from '@prisma/client';
import { ReportsService } from './reports.service';
import { QueryAdminMembershipEarningsDto } from './dto/query-admin-membership-earnings.dto';
import { QueryEarningsAggregationDto } from './dto/query-earnings-aggregation.dto';
import { QueryMemberWiseEarningsDto } from './dto/query-member-wise-earnings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Admin Membership Earnings Reports')
@Controller('admin/earnings/membership')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(MemberRole.ADMIN, MemberRole.SUB_ADMIN)
@ApiBearerAuth()
export class AdminEarningsMembershipController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  @ApiOperation({
    summary: 'GET /admin/earnings/membership — List membership earnings ledgers with filters',
    description:
      'Provides paginated membership commission earnings list with date range, member, level, and status filters plus overall summary metrics.',
  })
  @ApiResponse({ status: 200, description: 'Paginated earnings list and summary metrics' })
  async getEarningsList(@Query() query: QueryAdminMembershipEarningsDto) {
    return this.reportsService.getAdminMembershipEarnings(query);
  }

  @Get('level-wise')
  @ApiOperation({
    summary: 'GET /admin/earnings/membership/level-wise — Level-wise earnings aggregation',
    description:
      'Aggregates total earnings, ledger counts, and status breakdowns per level (levels 1..20).',
  })
  @ApiResponse({ status: 200, description: '20-level aggregated earnings table' })
  async getLevelWiseEarnings(@Query() query: QueryEarningsAggregationDto) {
    return this.reportsService.getLevelWiseEarnings(query);
  }

  @Get('member-wise')
  @ApiOperation({
    summary: 'GET /admin/earnings/membership/member-wise — Member-wise earnings aggregation',
    description:
      'Aggregates total membership commission earnings grouped by beneficiary member.',
  })
  @ApiResponse({ status: 200, description: 'Member-wise aggregated earnings response' })
  async getMemberWiseEarnings(@Query() query: QueryMemberWiseEarningsDto) {
    return this.reportsService.getMemberWiseEarnings(query);
  }
}
