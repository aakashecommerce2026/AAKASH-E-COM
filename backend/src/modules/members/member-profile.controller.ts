import {
  Controller,
  Get,
  Put,
  Body,
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
import { MemberProfileService } from './member-profile.service';
import { UpdateMemberProfileDto } from './dto/update-member-profile.dto';
import { UpdateUpiDto } from './dto/update-upi.dto';
import { MemberChangePasswordDto } from './dto/member-change-password.dto';
import { MemberResponseDto } from './dto/member-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OwnershipGuard } from '../auth/guards/ownership.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Member Profile Management')
@Controller('member')
@UseGuards(JwtAuthGuard, OwnershipGuard)
@ApiBearerAuth()
export class MemberProfileController {
  constructor(private readonly memberProfileService: MemberProfileService) {}

  @Get('profile')
  @ApiOperation({
    summary: 'GET /member/profile — View own member profile',
    description: 'Returns profile details strictly for the authenticated member derived from the JWT token.',
  })
  @ApiResponse({ status: 200, type: MemberResponseDto, description: 'Profile details returned successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@CurrentUser('id') memberId: string): Promise<MemberResponseDto> {
    return this.memberProfileService.getProfile(memberId);
  }

  @Put('profile')
  @ApiOperation({
    summary: 'PUT /member/profile — Update personal and contact information',
    description:
      'Updates name, email, mobile, address, and bankDetails with validation and unique field conflict checks. Audited to activity_logs.',
  })
  @ApiResponse({ status: 200, type: MemberResponseDto, description: 'Profile updated successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 409, description: 'Mobile number or Email address is already taken' })
  async updateProfile(
    @CurrentUser('id') memberId: string,
    @CurrentUser('role') role: MemberRole,
    @Body() updateDto: UpdateMemberProfileDto,
  ): Promise<MemberResponseDto> {
    return this.memberProfileService.updateProfile(memberId, updateDto, memberId, role);
  }

  @Put('profile/upi')
  @ApiOperation({
    summary: 'PUT /member/profile/upi — Update sensitive UPI details',
    description:
      'Audited dedicated endpoint to update member UPI VPA handle and registered account name inside bankDetails.',
  })
  @ApiResponse({ status: 200, type: MemberResponseDto, description: 'UPI details updated successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateUpi(
    @CurrentUser('id') memberId: string,
    @CurrentUser('role') role: MemberRole,
    @Body() updateUpiDto: UpdateUpiDto,
  ): Promise<MemberResponseDto> {
    return this.memberProfileService.updateUpi(memberId, updateUpiDto, memberId, role);
  }

  @Put('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'PUT /member/change-password — Change password for authenticated member',
    description:
      'Verifies current password, hashes new password with 12 salt rounds, and logs security change event to activity_logs.',
  })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Current password does not match' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async changePassword(
    @CurrentUser('id') memberId: string,
    @CurrentUser('role') role: MemberRole,
    @Body() changePasswordDto: MemberChangePasswordDto,
  ): Promise<{ message: string }> {
    return this.memberProfileService.changeMemberPassword(
      memberId,
      changePasswordDto,
      memberId,
      role,
    );
  }
}
