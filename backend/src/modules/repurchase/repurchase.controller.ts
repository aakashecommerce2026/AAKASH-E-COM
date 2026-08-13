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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
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
    summary: 'POST /admin/repurchase — Create in-store repurchase entry (Admin)',
    description:
      'Creates an in-store repurchase transaction. Validates that member exists & is ACTIVE, and transactionRef is unique. Triggers commission calculation on Day 9 engine.',
  })
  @ApiResponse({ status: 201, description: 'Repurchase entry created successfully', type: RepurchaseEntryResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error or member is not ACTIVE' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  @ApiResponse({ status: 409, description: 'Transaction reference collision' })
  async create(
    @Body() dto: CreateRepurchaseEntryDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.repurchaseService.create(dto, actorId);
  }

  @Get()
  @ApiOperation({
    summary: 'GET /admin/repurchase — Paginated list with search by transaction_ref/member/date range',
    description:
      'Lists repurchase entries filtered by memberId, transactionRef/member search, or transaction date range (excluding soft-deleted items).',
  })
  @ApiResponse({ status: 200, description: 'Paginated repurchase entries response' })
  async findAll(@Query() query: QueryRepurchaseEntryDto) {
    return this.repurchaseService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'GET /admin/repurchase/:id — Detail view' })
  @ApiParam({ name: 'id', description: 'Repurchase Entry UUID' })
  @ApiResponse({ status: 200, description: 'Repurchase entry details', type: RepurchaseEntryResponseDto })
  @ApiResponse({ status: 404, description: 'Repurchase entry not found' })
  async findById(@Param('id') id: string) {
    return this.repurchaseService.findById(id);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'PUT /admin/repurchase/:id — Edit entry (Locked once commission is generated)',
    description:
      'Updates repurchase entry details before commission calculation. Once commissions are generated, entry is locked against editing.',
  })
  @ApiParam({ name: 'id', description: 'Repurchase Entry UUID' })
  @ApiResponse({ status: 200, description: 'Repurchase entry updated successfully', type: RepurchaseEntryResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error, member not ACTIVE, or entry is locked post-commission' })
  @ApiResponse({ status: 404, description: 'Repurchase entry or member not found' })
  @ApiResponse({ status: 409, description: 'Transaction reference collision' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateRepurchaseEntryDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.repurchaseService.update(id, dto, actorId);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'DELETE /admin/repurchase/:id — Soft delete (Allowed only before commission generation)',
    description:
      'Soft-deletes repurchase entry. Only allowed BEFORE commission generation. If commissions exist, deletion is rejected.',
  })
  @ApiParam({ name: 'id', description: 'Repurchase Entry UUID' })
  @ApiResponse({ status: 200, description: 'Repurchase entry soft-deleted successfully' })
  @ApiResponse({ status: 400, description: 'Entry locked: commissions already generated' })
  @ApiResponse({ status: 404, description: 'Repurchase entry not found' })
  async remove(
    @Param('id') id: string,
    @CurrentUser('id') actorId: string,
  ) {
    return this.repurchaseService.remove(id, actorId);
  }
}
