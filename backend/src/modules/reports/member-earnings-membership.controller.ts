import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { QueryMemberEarningsDto } from './dto/query-member-earnings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Member Self-Service Earnings Reports')
@Controller('member/earnings/membership')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MemberEarningsMembershipController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  @ApiOperation({
    summary: 'GET /member/earnings/membership — Member self-service earnings',
    description:
      'Fetches membership commission earnings ledgers scoped strictly to the authenticated user ID (from JWT payload req.user.sub).',
  })
  @ApiResponse({ status: 200, description: 'Authenticated member membership earnings list and personal summary' })
  async getMyMembershipEarnings(
    @CurrentUser('id') memberId: string,
    @Query() query: QueryMemberEarningsDto,
  ) {
    return this.reportsService.getMemberEarnings(memberId, query);
  }
}
