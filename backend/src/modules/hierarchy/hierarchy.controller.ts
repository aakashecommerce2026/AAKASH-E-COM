import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MemberRole } from '@prisma/client';
import { HierarchyService } from './hierarchy.service';
import { GetHierarchyQueryDto } from './dto/get-hierarchy-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Admin Hierarchy Traversal')
@Controller('admin/hierarchy')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(MemberRole.ADMIN, MemberRole.SUB_ADMIN)
@ApiBearerAuth()
export class HierarchyController {
  constructor(private readonly hierarchyService: HierarchyService) {}

  @Get(':memberId/downline')
  @ApiOperation({
    summary: 'Get level-tagged recursive downline tree for a member (parameterized depth, max 20 levels)',
  })
  @ApiResponse({ status: 200, description: 'Level-tagged downline tree nodes array' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  async getDownline(
    @Param('memberId') memberId: string,
    @Query() query: GetHierarchyQueryDto,
  ) {
    const levels = query.maxLevels || 20;
    return this.hierarchyService.getDownline(memberId, levels);
  }

  @Get(':memberId/direct-referrals')
  @ApiOperation({
    summary: 'Get Level-1 direct referrals only for specified member ID',
  })
  @ApiResponse({ status: 200, description: 'Level-1 direct referrals list' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  async getDirectReferrals(@Param('memberId') memberId: string) {
    return this.hierarchyService.getDownline(memberId, 1);
  }

  @Get(':memberId/upline')
  @ApiOperation({
    summary: 'Get recursive upline chain from target member up to root sponsor (internal/admin debugging)',
  })
  @ApiResponse({ status: 200, description: 'Level-tagged upline referral chain array' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  async getUpline(
    @Param('memberId') memberId: string,
    @Query() query: GetHierarchyQueryDto,
  ) {
    const levels = query.maxLevels || 20;
    return this.hierarchyService.getUpline(memberId, levels);
  }
}
