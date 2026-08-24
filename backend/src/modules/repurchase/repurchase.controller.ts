import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
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
import { RepurchaseService } from './repurchase.service';
import { CreateRepurchaseEntryDto } from './dto/create-repurchase-entry.dto';
import { UpdateRepurchaseEntryDto } from './dto/update-repurchase-entry.dto';
import { QueryRepurchaseEntryDto } from './dto/query-repurchase-entry.dto';
import { RepurchaseEntryResponseDto } from './dto/repurchase-entry-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Admin In-Store Repurchase Entries')
@Controller(['admin/repurchase', 'admin/repurchases', 'repurchases'])
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(MemberRole.ADMIN, MemberRole.SUB_ADMIN)
@ApiBearerAuth()
export class AdminRepurchaseController {
  constructor(private readonly repurchaseService: RepurchaseService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      'POST /admin/repurchase — Create in-store repurchase entry (Admin)',
    description:
      'Creates an in-store repurchase transaction. Validates active member status, enforces DB-level transactionRef uniqueness (HTTP 409 on duplicate), and logs CREATE_REPURCHASE_ENTRY to activity_logs.',
  })
  @ApiResponse({
    status: 201,
    description: 'Repurchase entry created successfully',
    type: RepurchaseEntryResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error or member is not ACTIVE',
  })
  @ApiResponse({ status: 404, description: 'Member not found' })
  @ApiResponse({
    status: 409,
    description: 'Transaction reference collision (DB level P2002)',
  })
  async create(
    @Body() dto: CreateRepurchaseEntryDto,
    @CurrentUser('id') actorId: string,
    @CurrentUser('role') actorRole: MemberRole,
  ) {
    return this.repurchaseService.create(dto, actorId, actorRole);
  }

  @Get()
  @ApiOperation({
    summary:
      'GET /admin/repurchase — Paginated list with search by transaction_ref/member/date range',
    description:
      'Lists repurchase entries filtered by memberId/memberCode, transactionRef/member search, or transaction date range (excluding soft-deleted items).',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated repurchase entries response',
  })
  async findAll(@Query() query: QueryRepurchaseEntryDto) {
    return this.repurchaseService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'GET /admin/repurchase/:id — Detail view' })
  @ApiParam({ name: 'id', description: 'Repurchase Entry UUID' })
  @ApiResponse({
    status: 200,
    description: 'Repurchase entry details',
    type: RepurchaseEntryResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Repurchase entry not found' })
  async findById(@Param('id') id: string) {
    return this.repurchaseService.findById(id);
  }

  @Put(':id')
  @ApiOperation({
    summary:
      'PUT /admin/repurchase/:id — Edit entry (Locked once commission is generated)',
    description:
      'Updates repurchase entry details before commission calculation. Once commissions are generated, entry is locked against editing and logs UPDATE_REPURCHASE_ENTRY to activity_logs.',
  })
  @ApiParam({ name: 'id', description: 'Repurchase Entry UUID' })
  @ApiResponse({
    status: 200,
    description: 'Repurchase entry updated successfully',
    type: RepurchaseEntryResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Validation error, member not ACTIVE, or entry is locked post-commission',
  })
  @ApiResponse({
    status: 404,
    description: 'Repurchase entry or member not found',
  })
  @ApiResponse({ status: 409, description: 'Transaction reference collision' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateRepurchaseEntryDto,
    @CurrentUser('id') actorId: string,
    @CurrentUser('role') actorRole: MemberRole,
  ) {
    return this.repurchaseService.update(id, dto, actorId, actorRole);
  }

  @Delete(':id')
  @ApiOperation({
    summary:
      'DELETE /admin/repurchase/:id — Soft delete (Allowed only before commission generation)',
    description:
      'Soft-deletes repurchase entry (deletedAt timestamp). Allowed ONLY before commission generation. Logs DELETE_REPURCHASE_ENTRY to activity_logs.',
  })
  @ApiParam({ name: 'id', description: 'Repurchase Entry UUID' })
  @ApiResponse({
    status: 200,
    description: 'Repurchase entry soft-deleted successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Entry locked: commissions already generated',
  })
  @ApiResponse({ status: 404, description: 'Repurchase entry not found' })
  async remove(
    @Param('id') id: string,
    @CurrentUser('id') actorId: string,
    @CurrentUser('role') actorRole: MemberRole,
  ) {
    return this.repurchaseService.remove(id, actorId, actorRole);
  }
}
