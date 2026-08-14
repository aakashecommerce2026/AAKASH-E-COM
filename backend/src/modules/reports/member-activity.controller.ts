import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MemberPortalReportsService } from './member-portal-reports.service';
import { QueryMemberActivityDto } from './dto/query-member-activity.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Member Activity History')
@Controller('member/activity')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MemberActivityController {
  constructor(private readonly memberPortalReportsService: MemberPortalReportsService) {}

  @Get()
  @ApiOperation({
    summary: 'GET /member/activity — Scoped activity history feed',
    description:
      'Fetches earnings activities, repurchase activities, distribution payout activities, and historical records scoped strictly to the logged-in member. Sorted most-recent-first and paginated.',
  })
  @ApiResponse({ status: 200, description: 'Member activity history feed returned successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMyActivityHistory(
    @CurrentUser('id') memberId: string,
    @Query() query: QueryMemberActivityDto,
  ) {
    return this.memberPortalReportsService.getActivityHistory(memberId, query);
  }
}
