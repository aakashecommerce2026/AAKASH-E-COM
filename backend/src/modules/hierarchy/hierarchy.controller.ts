import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { MemberRole } from '@prisma/client';
import { HierarchyService } from './hierarchy.service';
import { GetHierarchyQueryDto } from './dto/get-hierarchy-query.dto';
import { SearchDownlineQueryDto } from './dto/search-downline-query.dto';
import { NetworkGrowthQueryDto } from './dto/network-growth-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Admin Hierarchy Traversal & Network Analytics')
@Controller('admin/hierarchy')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(MemberRole.ADMIN, MemberRole.SUB_ADMIN)
@ApiBearerAuth()
export class HierarchyController {
  constructor(private readonly hierarchyService: HierarchyService) {}

  @Get(':memberId/downline')
  @ApiOperation({
    summary: 'Get level-tagged recursive downline tree for a member',
    description:
      'Traverses the referral network downwards from target memberId up to parameterized depth (default 10, max 20 levels). Uses high-performance PostgreSQL Recursive CTE.',
  })
  @ApiParam({
    name: 'memberId',
    description: 'UUID of the root member to traverse downline from',
  })
  @ApiResponse({
    status: 200,
    description: 'Level-tagged recursive downline tree nodes array',
    schema: {
      example: [
        {
          id: 'b1c2d3e4-f5a6-7b8c-9d0e-1f2a3b4c5d6e',
          memberCode: 'AK10002',
          name: 'Jane Smith',
          mobile: '+919876543210',
          email: 'jane@example.com',
          referrerId: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
          joiningDate: '2026-08-01T10:00:00.000Z',
          status: 'ACTIVE',
          role: 'MEMBER',
          level: 1,
        },
      ],
    },
  })
  @ApiResponse({ status: 404, description: 'Member not found' })
  async getDownline(
    @Param('memberId') memberId: string,
    @Query() query: GetHierarchyQueryDto,
  ) {
    const levels = query.maxLevels || 20;
    return this.hierarchyService.getDownline(
      memberId,
      levels,
      query.includeSelf || false,
    );
  }

  @Get(':memberId/direct-referrals')
  @ApiOperation({
    summary: 'Get Level-1 direct referrals only for specified member ID',
    description:
      'Fetches direct referrals (Level 1 only) sponsored by target memberId.',
  })
  @ApiParam({ name: 'memberId', description: 'UUID of the target member' })
  @ApiResponse({
    status: 200,
    description: 'Level-1 direct referrals list',
    schema: {
      example: [
        {
          id: 'b1c2d3e4-f5a6-7b8c-9d0e-1f2a3b4c5d6e',
          memberCode: 'AK10002',
          name: 'Jane Smith',
          mobile: '+919876543210',
          email: 'jane@example.com',
          referrerId: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
          joiningDate: '2026-08-01T10:00:00.000Z',
          status: 'ACTIVE',
          role: 'MEMBER',
          level: 1,
        },
      ],
    },
  })
  @ApiResponse({ status: 404, description: 'Member not found' })
  async getDirectReferrals(@Param('memberId') memberId: string) {
    return this.hierarchyService.getDownline(memberId, 1);
  }

  @Get(':memberId/upline')
  @ApiOperation({
    summary: 'Get recursive upline chain from target member up to root sponsor',
    description:
      'Walks upwards from target memberId through direct sponsors to the root sponsor. Used for internal debugging and lineage checks.',
  })
  @ApiParam({
    name: 'memberId',
    description: 'UUID of the target member to walk upline from',
  })
  @ApiResponse({
    status: 200,
    description: 'Level-tagged upline referral chain array',
    schema: {
      example: [
        {
          id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
          memberCode: 'AK10001',
          name: 'Direct Sponsor',
          mobile: '+919876543200',
          email: 'sponsor@example.com',
          referrerId: '00000000-0000-0000-0000-000000000000',
          joiningDate: '2026-01-01T00:00:00.000Z',
          status: 'ACTIVE',
          role: 'ADMIN',
          level: 1,
        },
      ],
    },
  })
  @ApiResponse({ status: 404, description: 'Member not found' })
  async getUpline(
    @Param('memberId') memberId: string,
    @Query() query: GetHierarchyQueryDto,
  ) {
    const levels = query.maxLevels || 20;
    return this.hierarchyService.getUpline(memberId, levels);
  }

  @Get(':memberId/search')
  @ApiOperation({
    summary: "Search exclusively within a specific member's downline hierarchy",
    description:
      'Filters downline nodes under target memberId by matching query parameter q against name, memberCode, mobile, or email.',
  })
  @ApiParam({
    name: 'memberId',
    description: 'UUID of the root member whose downline is searched',
  })
  @ApiResponse({
    status: 200,
    description: 'Matching downline hierarchy nodes array',
    schema: {
      example: [
        {
          id: 'b1c2d3e4-f5a6-7b8c-9d0e-1f2a3b4c5d6e',
          memberCode: 'AK10005',
          name: 'John Doe',
          mobile: '+919999999999',
          email: 'john@example.com',
          referrerId: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
          joiningDate: '2026-08-05T12:30:00.000Z',
          status: 'ACTIVE',
          role: 'MEMBER',
          level: 2,
        },
      ],
    },
  })
  @ApiResponse({ status: 400, description: 'Missing search query parameter q' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  async searchDownline(
    @Param('memberId') memberId: string,
    @Query() query: SearchDownlineQueryDto,
  ) {
    return this.hierarchyService.searchDownline(memberId, query);
  }

  @Get(':memberId/growth')
  @ApiOperation({
    summary:
      'Get network growth breakdown (new joins per level per week or month)',
    description:
      'Aggregates new member registrations per level per time bucket (week or month) for Admin Analyze Network Growth requirement.',
  })
  @ApiParam({ name: 'memberId', description: 'UUID of the target member' })
  @ApiResponse({
    status: 200,
    description: 'Network growth analytics breakdown points array',
    schema: {
      example: [
        {
          period: '2026-08',
          level: 1,
          joinCount: 15,
        },
        {
          period: '2026-08',
          level: 2,
          joinCount: 42,
        },
      ],
    },
  })
  @ApiResponse({ status: 404, description: 'Member not found' })
  async getNetworkGrowth(
    @Param('memberId') memberId: string,
    @Query() query: NetworkGrowthQueryDto,
  ) {
    return this.hierarchyService.getNetworkGrowth(memberId, query);
  }

  @Get(':memberId/branch-counts')
  @ApiOperation({
    summary:
      'Get branch count breakdown for each Level-1 leg under target member',
    description:
      'Computes total downline and active member counts for each direct Level-1 referral leg under target memberId.',
  })
  @ApiParam({ name: 'memberId', description: 'UUID of the target member' })
  @ApiResponse({
    status: 200,
    description:
      'Branch leg breakdown array with total and active downline counts',
    schema: {
      example: [
        {
          branchRootId: 'b1c2d3e4-f5a6-7b8c-9d0e-1f2a3b4c5d6e',
          branchRootCode: 'AK10002',
          branchRootName: 'Leg 1 Sponsor',
          status: 'ACTIVE',
          totalDownlineInBranch: 25,
          activeMembersInBranch: 22,
        },
      ],
    },
  })
  @ApiResponse({ status: 404, description: 'Member not found' })
  async getBranchCounts(
    @Param('memberId') memberId: string,
    @Query() query: GetHierarchyQueryDto,
  ) {
    const levels = query.maxLevels || 20;
    return this.hierarchyService.getBranchCounts(memberId, levels);
  }

  @Get(':memberId/summary')
  @ApiOperation({
    summary: 'Get comprehensive hierarchy summary dashboard statistics',
    description:
      'Returns total downline metrics, active vs inactive counts, total branches, leg breakdown, and level distribution in a single summary response.',
  })
  @ApiParam({ name: 'memberId', description: 'UUID of the target member' })
  @ApiResponse({
    status: 200,
    description: 'Comprehensive network dashboard summary object',
    schema: {
      example: {
        memberId: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
        memberCode: 'AK10001',
        memberName: 'Root Sponsor',
        totalDownline: 120,
        activeDownline: 110,
        inactiveDownline: 10,
        totalBranches: 4,
        branches: [
          {
            branchRootId: 'b1c2d3e4-f5a6-7b8c-9d0e-1f2a3b4c5d6e',
            branchRootCode: 'AK10002',
            branchRootName: 'Leg 1',
            status: 'ACTIVE',
            totalDownlineInBranch: 45,
            activeMembersInBranch: 42,
          },
        ],
        levelBreakdown: [
          { level: 1, totalCount: 4, activeCount: 4 },
          { level: 2, totalCount: 16, activeCount: 15 },
        ],
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Member not found' })
  async getHierarchySummary(
    @Param('memberId') memberId: string,
    @Query() query: GetHierarchyQueryDto,
  ) {
    const levels = query.maxLevels || 20;
    return this.hierarchyService.getHierarchySummary(memberId, levels);
  }
}
