import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { MemberRole } from '@prisma/client';
import { MembershipCommissionService } from './membership-commission.service';
import {
  CreateCommissionConfigDto,
  MembershipCommissionConfigResponseDto,
} from './dto/membership-commission-config.dto';
import { QueryMembershipCommissionDto } from './dto/query-membership-commission.dto';
import { MembershipCommissionResponseDto } from './dto/membership-commission-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Membership Commission Engine & Config')
@Controller('membership-commissions')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class MembershipCommissionController {
  constructor(
    private readonly membershipCommissionService: MembershipCommissionService,
  ) {}

  @Get('config')
  @ApiOperation({
    summary:
      'Get active 20-level membership commission rate configuration table',
    description:
      'Fetches the active version (or specified version) 20-level percentage schedule from database configuration.',
  })
  @ApiResponse({
    status: 200,
    description: 'Active 20-level commission percentage table',
    type: [MembershipCommissionConfigResponseDto],
  })
  async getConfig(
    @Query('version') version?: number,
  ): Promise<MembershipCommissionConfigResponseDto[]> {
    return this.membershipCommissionService.getActiveConfig(
      version ? Number(version) : undefined,
    );
  }

  @Post('config')
  @Roles(MemberRole.ADMIN)
  @ApiOperation({
    summary:
      'Publish a versioned 20-level commission rate configuration (Admin only)',
    description:
      'Stores a new versioned 20-level percentage schedule in DB. Deactivates older active versions if isActive is true, making future rate updates safe without code edits.',
  })
  @ApiResponse({
    status: 201,
    description: 'Commission configuration created and activated successfully',
    type: [MembershipCommissionConfigResponseDto],
  })
  async createConfig(
    @Body() dto: CreateCommissionConfigDto,
    @CurrentUser('id') actorId: string,
  ): Promise<MembershipCommissionConfigResponseDto[]> {
    return this.membershipCommissionService.publishConfigVersion(dto, actorId);
  }

  @Get('ledger')
  @ApiOperation({
    summary: 'Query membership commission ledgers',
    description:
      'Lists membership commission ledgers filtered by sourceMemberId, beneficiaryMemberId, level, status, or date.',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated membership commission ledger records',
  })
  async findAll(@Query() query: QueryMembershipCommissionDto) {
    return this.membershipCommissionService.findAll(query);
  }

  @Get('ledger/:id')
  @ApiOperation({
    summary: 'Get single membership commission ledger by ID',
  })
  @ApiParam({ name: 'id', description: 'Commission ledger UUID' })
  @ApiResponse({
    status: 200,
    type: MembershipCommissionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Ledger not found' })
  async findById(
    @Param('id') id: string,
  ): Promise<MembershipCommissionResponseDto> {
    return this.membershipCommissionService.findById(id);
  }

  @Post('trigger/:memberId')
  @Roles(MemberRole.ADMIN, MemberRole.SUB_ADMIN)
  @ApiOperation({
    summary:
      'Manually trigger or re-process 20-level registration commission engine for a member (Admin)',
    description:
      'Walks up the 20-level referral tree for target memberId and calculates membership commission ledgers if not already present.',
  })
  @ApiParam({
    name: 'memberId',
    description: 'UUID of the newly registered member',
  })
  @ApiResponse({
    status: 201,
    description: 'Commission ledgers generated successfully',
    type: [MembershipCommissionResponseDto],
  })
  async triggerRegistrationCommission(
    @Param('memberId') memberId: string,
    @Query('packageAmount') packageAmount?: number,
  ): Promise<MembershipCommissionResponseDto[]> {
    const amount = packageAmount ? Number(packageAmount) : 1000;
    return this.membershipCommissionService.calculateForNewMember(
      memberId,
      amount,
    );
  }
}
