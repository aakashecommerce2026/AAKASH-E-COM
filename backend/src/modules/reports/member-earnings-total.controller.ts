import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MemberPortalReportsService } from './member-portal-reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Member Self-Service Earnings Reports')
@Controller('member/earnings/total')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MemberEarningsTotalController {
  constructor(private readonly memberPortalReportsService: MemberPortalReportsService) {}

  @Get()
  @ApiOperation({
    summary: 'GET /member/earnings/total — Combined total earnings summary',
    description:
      'Aggregates combined membership earnings, repurchase earnings, total distributed payouts, and pending distributions scoped strictly to the authenticated member.',
  })
  @ApiResponse({ status: 200, description: 'Combined total earnings summary returned successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMyTotalEarnings(@CurrentUser('id') memberId: string) {
    return this.memberPortalReportsService.getTotalEarningsSummary(memberId);
  }
}
