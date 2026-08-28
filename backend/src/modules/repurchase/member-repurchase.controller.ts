import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RepurchaseService } from './repurchase.service';
import { QueryRepurchaseEntryDto } from './dto/query-repurchase-entry.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Member Repurchase History')
@Controller(['member/repurchase', 'member/repurchases'])
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MemberRepurchaseController {
  constructor(private readonly repurchaseService: RepurchaseService) {}

  @Get()
  @ApiOperation({
    summary: 'GET /member/repurchase — View own member repurchase transaction history',
    description:
      'Returns paginated list of repurchase orders for the currently authenticated member.',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of member repurchase transactions',
  })
  async getMyRepurchases(
    @CurrentUser('id') memberId: string,
    @Query() query: QueryRepurchaseEntryDto,
  ) {
    return this.repurchaseService.findAll({ ...query, memberId });
  }
}
