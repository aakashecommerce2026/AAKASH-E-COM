import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MemberPortalReportsService } from './member-portal-reports.service';
import { QueryMemberEarningsBreakdownDto } from './dto/query-member-earnings-breakdown.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Member Self-Service Earnings Reports')
@Controller('member/earnings/membership')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MemberEarningsMembershipController {
  constructor(
    private readonly memberPortalReportsService: MemberPortalReportsService,
  ) {}

  @Get()
  @ApiOperation({
    summary:
      'GET /member/earnings/membership?range=daily|weekly|monthly — Membership earnings breakdown',
    description:
      'Grouped aggregation queries on membership_commission_ledger scoped strictly to beneficiary_member_id = self derived from JWT payload.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Authenticated member membership earnings breakdown returned successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMyMembershipEarnings(
    @CurrentUser('id') memberId: string,
    @Query() query: QueryMemberEarningsBreakdownDto,
  ) {
    return this.memberPortalReportsService.getMembershipEarningsBreakdown(
      memberId,
      query,
    );
  }
}
