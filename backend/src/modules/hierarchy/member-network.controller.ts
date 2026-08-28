import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { HierarchyService } from './hierarchy.service';
import { GetHierarchyQueryDto } from './dto/get-hierarchy-query.dto';
import { SearchDownlineQueryDto } from './dto/search-downline-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Member Network Visibility')
@Controller('member/network')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MemberNetworkController {
  constructor(private readonly hierarchyService: HierarchyService) {}

  @Get('direct-referrals')
  @ApiOperation({
    summary:
      'GET /member/network/direct-referrals — View level-1 direct referrals only',
    description:
      'Fetches direct referrals (Level 1 only) sponsored by the logged-in member. Root is strictly enforced server-side from JWT.',
  })
  @ApiResponse({
    status: 200,
    description: 'Level 1 direct referrals list returned successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getDirectReferrals(@CurrentUser('id') memberId: string) {
    return this.hierarchyService.getDownline(memberId, 1);
  }

  @Get('downline')
  @ApiOperation({
    summary:
      'GET /member/network/downline — View full downline up to 20 levels',
    description:
      'Fetches level-tagged downline network up to 20 levels for the logged-in member as root. Root is strictly enforced server-side from JWT.',
  })
  @ApiResponse({
    status: 200,
    description: 'Level-tagged downline tree nodes array',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getDownline(
    @CurrentUser('id') memberId: string,
    @Query() query: GetHierarchyQueryDto,
  ) {
    const levels = query.maxLevels || 20;
    const includeSelf = query.includeSelf !== false;
    return this.hierarchyService.getDownline(memberId, levels, includeSelf);
  }

  @Get('summary')
  @ApiOperation({
    summary:
      'GET /member/network/summary — View personal network summary dashboard',
    description:
      'Returns total downline metrics, active vs inactive counts, branch counts, and level breakdown for the logged-in member as root.',
  })
  @ApiResponse({ status: 200, description: 'Personal network summary object' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getNetworkSummary(
    @CurrentUser('id') memberId: string,
    @Query() query: GetHierarchyQueryDto,
  ) {
    const levels = query.maxLevels || 20;
    return this.hierarchyService.getHierarchySummary(memberId, levels);
  }

  @Get('search')
  @ApiOperation({
    summary: 'GET /member/network/search — Search within own downline network',
    description:
      'Filters downline nodes strictly under the logged-in member by matching query against name, code, mobile, or email.',
  })
  @ApiResponse({
    status: 200,
    description: 'Matching downline hierarchy nodes array',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async searchDownline(
    @CurrentUser('id') memberId: string,
    @Query() query: SearchDownlineQueryDto,
  ) {
    return this.hierarchyService.searchDownline(memberId, query);
  }
}
