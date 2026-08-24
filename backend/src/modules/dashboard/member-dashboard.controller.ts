import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Member Dashboard')
@Controller('member/dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MemberDashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({
    summary: 'GET /member/dashboard — Member Personal Dashboard',
    description:
      'Provides aggregated metrics strictly for the authenticated member (total direct referrals, downline count, membership earnings, repurchase earnings, total earnings summary). Member ID is derived strictly from the JWT token.',
  })
  @ApiQuery({
    name: 'refresh',
    required: false,
    type: Boolean,
    description: 'Bypass cache and force real-time calculation',
  })
  @ApiResponse({
    status: 200,
    description: 'Member personal dashboard returned successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMemberDashboard(
    @CurrentUser('id') memberId: string,
    @Query('refresh') refresh?: boolean,
  ) {
    const isRefresh = String(refresh) === 'true' || refresh === true;
    return this.dashboardService.getMemberPersonalDashboard(
      memberId,
      isRefresh,
    );
  }
}
