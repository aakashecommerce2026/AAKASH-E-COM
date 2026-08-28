import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
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
} from '@nestjs/swagger';
import { MemberRole } from '@prisma/client';
import { MembersService } from './members.service';
import { CreateAdminMemberDto } from './dto/create-admin-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { FreezeCommissionDto } from './dto/freeze-commission.dto';
import { QueryMembersDto } from './dto/query-members.dto';
import { ReassignReferrerDto } from './dto/reassign-referrer.dto';
import { MemberResponseDto } from './dto/member-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

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
    summary:
      'Create member (Admin), auto-generate memberCode & temp password if missing, link active referrer, log audit',
  })
  @ApiResponse({
    status: 201,
    description: 'Member created successfully',
    type: MemberResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error or invalid active referrer',
  })
  @ApiResponse({
    status: 409,
    description: 'Member code, mobile, or email collision',
  })
  async createMember(
    @Body() dto: CreateAdminMemberDto,
    @CurrentUser('id') actorId: string,
    @CurrentUser('role') actorRole: MemberRole,
  ) {
    return this.membersService.createByAdmin(dto, actorId, actorRole);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Edit member details and log activity audit' })
  @ApiResponse({
    status: 200,
    description: 'Member updated successfully',
    type: MemberResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid data, self-referrer error, or commission restriction',
  })
  @ApiResponse({ status: 404, description: 'Member not found' })
  async updateMember(
    @Param('id') id: string,
    @Body() dto: UpdateMemberDto,
    @CurrentUser('id') actorId: string,
    @CurrentUser('role') actorRole: MemberRole,
  ) {
    return this.membersService.update(id, dto, actorId, actorRole);
  }

  @Patch(':id/commission-freeze')
  @ApiOperation({ summary: 'Freeze or unfreeze commission payouts for a member' })
  @ApiResponse({
    status: 200,
    description: 'Member commission freeze status updated successfully',
    type: MemberResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Member not found' })
  async toggleCommissionFreeze(
    @Param('id') id: string,
    @Body() dto: FreezeCommissionDto,
    @CurrentUser('id') actorId: string,
    @CurrentUser('role') actorRole: MemberRole,
  ) {
    return this.membersService.toggleCommissionFreeze(id, dto, actorId, actorRole);
  }

  @Post(':id/reassign-referrer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Guarded flow to reassign a member referrer with cycle checks and audit logging',
  })
  @ApiResponse({
    status: 200,
    description: 'Referrer reassigned successfully',
    type: MemberResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Circular dependency, inactive referrer, or self-referral error',
  })
  @ApiResponse({ status: 404, description: 'Member or new referrer not found' })
  async reassignReferrer(
    @Param('id') id: string,
    @Body() dto: ReassignReferrerDto,
    @CurrentUser('id') actorId: string,
    @CurrentUser('role') actorRole: MemberRole,
  ) {
    return this.membersService.reassignReferrer(id, dto, actorId, actorRole);
  }

  @Get()
  @ApiOperation({
    summary: 'Get paginated member list with search and filters',
  })
  @ApiResponse({ status: 200, description: 'Paginated members response' })
  async getMembers(@Query() query: QueryMembersDto) {
    return this.membersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'View single member details with populated referrer info',
  })
  @ApiResponse({
    status: 200,
    description: 'Member profile with populated referrer',
  })
  @ApiResponse({ status: 404, description: 'Member not found' })
  async getMemberById(@Param('id') id: string) {
    return this.membersService.findByIdWithReferrer(id);
  }

  @Get(':id/referrer')
  @ApiOperation({
    summary: 'Get direct referrer member details for specified member ID',
  })
  @ApiResponse({ status: 200, description: 'Referrer profile details' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  async getMemberReferrer(@Param('id') id: string) {
    return this.membersService.getReferrerInfo(id);
  }

  @Get(':id/downline-preview')
  @ApiOperation({
    summary:
      'Get shallow (1-level) direct downline referrals preview for specified member ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Direct downline referrals list and summary counts',
  })
  @ApiResponse({ status: 404, description: 'Member not found' })
  async getMemberDownlinePreview(@Param('id') id: string) {
    return this.membersService.getDownlinePreview(id);
  }

  @Delete(':id')
  @Roles(MemberRole.ADMIN)
  @ApiOperation({
    summary: 'Delete a member and re-attach direct downlines to Super Admin (Admin only)',
    description:
      'Safely deletes member account, re-parents all direct referral downlines to Super Admin, dispatches deletion email, and logs activity audit.',
  })
  @ApiResponse({
    status: 200,
    description: 'Member deleted and downlines re-attached to Super Admin successfully',
  })
  @ApiResponse({ status: 400, description: 'Cannot delete Super Admin root member' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  async deleteMember(
    @Param('id') id: string,
    @CurrentUser('id') actorId: string,
    @CurrentUser('role') actorRole: MemberRole,
  ) {
    return this.membersService.deleteMember(id, actorId, actorRole);
  }
}
