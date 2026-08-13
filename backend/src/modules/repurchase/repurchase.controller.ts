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
@Controller('repurchases')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(MemberRole.ADMIN, MemberRole.SUB_ADMIN)
@ApiBearerAuth()
export class RepurchaseController {
  constructor(private readonly repurchaseService: RepurchaseService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Record in-store repurchase entry (Admin)',
    description:
      'Creates an in-store repurchase transaction. Validates that member exists & is ACTIVE, and transactionRef is unique.',
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
    summary: 'Get paginated list of repurchase entries with filters',
    description:
      'Lists repurchase entries filtered by memberId, transactionRef/member search, or transaction date range.',
  })
  @ApiResponse({ status: 200, description: 'Paginated repurchase entries response' })
  async findAll(@Query() query: QueryRepurchaseEntryDto) {
    return this.repurchaseService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single repurchase entry by ID' })
  @ApiParam({ name: 'id', description: 'Repurchase Entry UUID' })
  @ApiResponse({ status: 200, description: 'Repurchase entry details', type: RepurchaseEntryResponseDto })
  @ApiResponse({ status: 404, description: 'Repurchase entry not found' })
  async findById(@Param('id') id: string) {
    return this.repurchaseService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update existing repurchase entry' })
  @ApiParam({ name: 'id', description: 'Repurchase Entry UUID' })
  @ApiResponse({ status: 200, description: 'Repurchase entry updated successfully', type: RepurchaseEntryResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error or member is not ACTIVE' })
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
  @ApiOperation({ summary: 'Delete repurchase entry by ID' })
  @ApiParam({ name: 'id', description: 'Repurchase Entry UUID' })
  @ApiResponse({ status: 200, description: 'Repurchase entry deleted successfully' })
  @ApiResponse({ status: 404, description: 'Repurchase entry not found' })
  async remove(
    @Param('id') id: string,
    @CurrentUser('id') actorId: string,
  ) {
    return this.repurchaseService.remove(id, actorId);
  }
}
