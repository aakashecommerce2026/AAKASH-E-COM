import {
  Controller,
  Get,
  Post,
  Put,
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
} from '@nestjs/swagger';
import { MemberRole } from '@prisma/client';
import { MembersService } from './members.service';
import { CreateAdminMemberDto } from './dto/create-admin-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { QueryMembersDto } from './dto/query-members.dto';
import { MemberResponseDto } from './dto/member-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Admin Members Management')
@Controller('admin/members')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(MemberRole.ADMIN, MemberRole.SUB_ADMIN)
@ApiBearerAuth()
export class AdminMembersController {
  constructor(private readonly membersService: MembersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create member (Admin), auto-generate memberCode & temp password if missing, link active referrer',
  })
  @ApiResponse({ status: 201, description: 'Member created successfully', type: MemberResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error or invalid active referrer' })
  @ApiResponse({ status: 409, description: 'Member code, mobile, or email collision' })
  async createMember(@Body() dto: CreateAdminMemberDto) {
    return this.membersService.createByAdmin(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Edit member details' })
  @ApiResponse({ status: 200, description: 'Member updated successfully', type: MemberResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid data or self-referrer error' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  async updateMember(@Param('id') id: string, @Body() dto: UpdateMemberDto) {
    return this.membersService.update(id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get paginated member list with search and filters' })
  @ApiResponse({ status: 200, description: 'Paginated members response' })
  async getMembers(@Query() query: QueryMembersDto) {
    return this.membersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'View single member details with populated referrer info' })
  @ApiResponse({ status: 200, description: 'Member profile with populated referrer' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  async getMemberById(@Param('id') id: string) {
    return this.membersService.findByIdWithReferrer(id);
  }

  @Get(':id/referrer')
  @ApiOperation({ summary: 'Get direct referrer member details for specified member ID' })
  @ApiResponse({ status: 200, description: 'Referrer profile details' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  async getMemberReferrer(@Param('id') id: string) {
    return this.membersService.getReferrerInfo(id);
  }

  @Get(':id/downline-preview')
  @ApiOperation({ summary: 'Get shallow (1-level) direct downline referrals preview for specified member ID' })
  @ApiResponse({ status: 200, description: 'Direct downline referrals list and summary counts' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  async getMemberDownlinePreview(@Param('id') id: string) {
    return this.membersService.getDownlinePreview(id);
  }
}
