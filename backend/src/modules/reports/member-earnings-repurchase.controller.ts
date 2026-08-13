import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { QueryMemberEarningsDto } from './dto/query-member-earnings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Member Repurchase Earnings')
@Controller('member/earnings/repurchase')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MemberEarningsRepurchaseController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  @ApiOperation({
    summary: 'GET /member/earnings/repurchase — Logged-in member repurchase earnings history',
    description:
      'Returns paginated list of repurchase commission ledgers earned by the logged-in member, scoped strictly by JWT payload member ID.',
  })
  @ApiResponse({ status: 200, description: 'Member repurchase earnings list and summary totals' })
  async getMemberRepurchaseEarnings(
    @CurrentUser('id') loggedInUserId: string,
    @Query() query: QueryMemberEarningsDto,
  ) {
    return this.reportsService.getMemberRepurchaseEarnings(loggedInUserId, query);
  }
}
