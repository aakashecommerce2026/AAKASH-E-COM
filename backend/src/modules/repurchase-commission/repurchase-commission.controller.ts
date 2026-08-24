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
} from '@nestjs/swagger';
import { MemberRole } from '@prisma/client';
import { RepurchaseCommissionService } from './repurchase-commission.service';
import {
  UpdateRepurchaseCommissionConfigDto,
  RepurchaseCommissionConfigResponseDto,
} from './dto/repurchase-commission-config.dto';
import { QueryRepurchaseCommissionDto } from './dto/query-repurchase-commission.dto';
import { RepurchaseCommissionResponseDto } from './dto/repurchase-commission-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Repurchase Commission Engine & Config')
@Controller('repurchase-commissions')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class RepurchaseCommissionController {
  constructor(
    private readonly repurchaseCommissionService: RepurchaseCommissionService,
  ) {}

  @Get('config')
  @ApiOperation({
    summary:
      'Get active 20-level repurchase commission rate configuration table',
    description:
      'Fetches the active version (or specified version) 20-level percentage schedule for repurchase commissions.',
  })
  @ApiResponse({
    status: 200,
    description: 'Active 20-level repurchase commission percentage table',
    type: [RepurchaseCommissionConfigResponseDto],
  })
  async getConfig(
    @Query('version') version?: number,
  ): Promise<RepurchaseCommissionConfigResponseDto[]> {
    return this.repurchaseCommissionService.getActiveConfig(
      version ? Number(version) : undefined,
    );
  }

  @Post('config')
  @Roles(MemberRole.ADMIN)
  @ApiOperation({
    summary:
      'Publish a versioned 20-level repurchase commission rate configuration (Admin only)',
    description:
      'Stores a new versioned 20-level percentage schedule in DB (must sum to EXACTLY 5.00%). Deactivates older active versions.',
  })
  @ApiResponse({
    status: 201,
    description:
      'Repurchase commission configuration created and activated successfully',
    type: [RepurchaseCommissionConfigResponseDto],
  })
  async updateConfig(
    @Body() dto: UpdateRepurchaseCommissionConfigDto,
    @CurrentUser('id') actorId: string,
  ): Promise<RepurchaseCommissionConfigResponseDto[]> {
    return this.repurchaseCommissionService.updateConfig(dto, actorId);
  }

  @Get('ledger')
  @ApiOperation({
    summary: 'Query repurchase commission ledgers',
    description:
      'Lists repurchase commission ledgers filtered by repurchaseEntryId, sourceMemberId, beneficiaryMemberId, level, or status.',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated repurchase commission ledger records',
  })
  async findAll(@Query() query: QueryRepurchaseCommissionDto) {
    return this.repurchaseCommissionService.findAll(query);
  }

  @Get('ledger/:id')
  @ApiOperation({
    summary: 'Get single repurchase commission ledger by ID',
  })
  @ApiParam({ name: 'id', description: 'Commission ledger UUID' })
  @ApiResponse({
    status: 200,
    type: RepurchaseCommissionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Ledger not found' })
  async findById(@Param('id') id: string) {
    return this.repurchaseCommissionService.findById(id);
  }

  @Post('trigger/:repurchaseEntryId')
  @Roles(MemberRole.ADMIN, MemberRole.SUB_ADMIN)
  @ApiOperation({
    summary:
      'Manually trigger or re-process 20-level repurchase commission engine for an entry (Admin)',
    description:
      'Walks up the 20-level referral tree for target repurchaseEntryId and calculates repurchase commission ledgers.',
  })
  @ApiParam({
    name: 'repurchaseEntryId',
    description: 'UUID of the target repurchase entry',
  })
  @ApiResponse({
    status: 201,
    description: 'Repurchase commission ledgers generated successfully',
  })
  async triggerRepurchaseCommission(
    @Param('repurchaseEntryId') repurchaseEntryId: string,
  ) {
    return this.repurchaseCommissionService.calculateForEntry(
      repurchaseEntryId,
    );
  }
}
