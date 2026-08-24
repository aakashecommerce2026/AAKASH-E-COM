import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
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

const profilePhotoStorage = diskStorage({
  destination: (req, file, cb) => {
    const dest = join(process.cwd(), 'uploads', 'profile-photos');
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = extname(file.originalname) || '.jpg';
    cb(null, `avatar-${uniqueSuffix}${ext}`);
  },
});

@ApiTags('Member Profile Management')
@Controller('member')
@UseGuards(JwtAuthGuard)
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

  @Post('profile/photo')
  @ApiOperation({
    summary: 'POST /member/profile/photo — Upload member profile photo',
    description: 'Accepts image files (jpg, jpeg, png, webp up to 5MB), saves to local disk, and updates profilePhoto column.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, type: MemberResponseDto, description: 'Profile photo uploaded successfully' })
  @ApiResponse({ status: 400, description: 'File validation error' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: profilePhotoStorage,
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        if (!file.mimetype || !file.mimetype.startsWith('image/')) {
          return cb(new BadRequestException('Only image files (jpg, jpeg, png, webp, gif) are allowed!'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadProfilePhoto(
    @CurrentUser('id') memberId: string,
    @UploadedFile() file: any,
  ): Promise<MemberResponseDto> {
    if (!file) {
      throw new BadRequestException('Please select an image file (jpg, png, webp) to upload');
    }
    const photoUrl = `/uploads/profile-photos/${file.filename}`;
    return this.memberProfileService.updateProfilePhoto(memberId, photoUrl);
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
