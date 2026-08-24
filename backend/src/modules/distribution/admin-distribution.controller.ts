import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { MemberRole } from '@prisma/client';
import { DistributionService } from './distribution.service';
import { QueryPendingDistributionDto } from './dto/query-pending-distribution.dto';
import { ProcessDistributionBatchDto } from './dto/process-distribution-batch.dto';
import { QueryDistributionHistoryDto } from './dto/query-distribution-history.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Admin Commission Distribution')
@Controller('admin/distribution')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(MemberRole.ADMIN, MemberRole.SUB_ADMIN)
@ApiBearerAuth()
export class AdminDistributionController {
  constructor(private readonly distributionService: DistributionService) {}

  @Get('pending')
  @ApiOperation({
    summary:
      'GET /admin/distribution/pending — Aggregated view of all PENDING membership + repurchase commissions',
    description:
      'Fetches pending membership and repurchase ledgers, grouped per beneficiary member with gross earnings, 5% TDS deduction, 5% Admin Fee deduction, net payable amount, and bank details.',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated pending distribution report and summary totals',
  })
  async getPendingCommissions(@Query() query: QueryPendingDistributionDto) {
    return this.distributionService.getPendingCommissions(query);
  }

  @Post('process')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      'POST /admin/distribution/process — Execute payout batch processing run',
    description:
      'Creates a distribution_batch, aggregates selected pending ledgers per member, calculates 5% TDS and 5% Admin Fee, marks ledgers as DISBURSED, and records the batch.',
  })
  @ApiResponse({
    status: 201,
    description: 'Distribution batch created and processed successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'No pending ledgers match criteria or validation error',
  })
  async processBatch(
    @Body() dto: ProcessDistributionBatchDto,
    @CurrentUser('id') actorId: string,
    @CurrentUser('role') actorRole: MemberRole,
  ) {
    return this.distributionService.processDistributionBatch(
      dto,
      actorId,
      actorRole,
    );
  }

  @Get('history')
  @ApiOperation({
    summary:
      'GET /admin/distribution/history — List past distribution batches with totals',
    description:
      'Returns paginated list of past distribution batch execution runs with total member counts, gross/net amounts, status, and processor details.',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of distribution batch history',
  })
  async getBatchHistory(@Query() query: QueryDistributionHistoryDto) {
    return this.distributionService.getBatchHistory(query);
  }

  @Get(':batchId')
  @ApiOperation({
    summary:
      'GET /admin/distribution/:batchId — Single distribution batch details',
    description:
      'Returns full detail view for a specific distribution batch by UUID or batchNo, including all member payout records and linked commission ledgers.',
  })
  @ApiParam({
    name: 'batchId',
    description:
      'Distribution Batch UUID or batchNo (e.g. BATCH-20260813-0001)',
  })
  @ApiResponse({ status: 200, description: 'Distribution batch detail object' })
  @ApiResponse({ status: 404, description: 'Distribution batch not found' })
  async getBatchById(@Param('batchId') batchId: string) {
    return this.distributionService.getBatchById(batchId);
  }
}
