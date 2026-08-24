import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Optional,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { DashboardCacheService } from '../dashboard/dashboard-cache.service';
import { UpdateMemberProfileDto } from './dto/update-member-profile.dto';
import { UpdateUpiDto } from './dto/update-upi.dto';
import { MemberChangePasswordDto } from './dto/member-change-password.dto';
import { MemberResponseDto } from './dto/member-response.dto';
import { MemberRole } from '@prisma/client';

@Injectable()
export class MemberProfileService {
  private readonly BCRYPT_SALT_ROUNDS = 12;

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    @Optional() private readonly dashboardCacheService?: DashboardCacheService,
  ) {}

  /**
   * View own profile details by member ID.
   */
  async getProfile(memberId: string): Promise<MemberResponseDto> {
    const member = await this.prisma.member.findUnique({
      where: { id: memberId },
      include: {
        referrer: {
          select: {
            id: true,
            memberCode: true,
            name: true,
            email: true,
            mobile: true,
          },
        },
      },
    });

    if (!member) {
      throw new NotFoundException(`Member with ID '${memberId}' not found`);
    }

    return this.mapToResponseDto(member);
  }

  /**
   * Update personal and contact profile information with validation & collision checks.
   */
  async updateProfile(
    memberId: string,
    updateDto: UpdateMemberProfileDto,
    actorId?: string,
    actorRole?: MemberRole,
  ): Promise<MemberResponseDto> {
    const member = await this.prisma.member.findUnique({
      where: { id: memberId },
    });
    if (!member) {
      throw new NotFoundException(`Member with ID '${memberId}' not found`);
    }

    const {
      email,
      mobile,
      name,
      username,
      address,
      profilePhoto,
      upiId,
      bankDetails,
    } = updateDto as any;

    // Unique field collision checks for mobile, email, or username
    if (mobile || email || username) {
      const existing = await this.prisma.member.findFirst({
        where: {
          AND: [
            { id: { not: memberId } },
            {
              OR: [
                ...(mobile ? [{ mobile }] : []),
                ...(email ? [{ email }] : []),
                ...(username ? [{ username }] : []),
              ],
            },
          ],
        },
      });

      if (existing) {
        if (mobile && existing.mobile === mobile) {
          throw new ConflictException(
            `Mobile number '${mobile}' is already taken`,
          );
        }
        if (email && existing.email === email) {
          throw new ConflictException(
            `Email address '${email}' is already taken`,
          );
        }
        if (username && existing.username === username) {
          throw new ConflictException(
            `Username '${username}' is already taken`,
          );
        }
      }
    }

    const updatedMember = await this.prisma.member.update({
      where: { id: memberId },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(username !== undefined ? { username } : {}),
        ...(email !== undefined ? { email } : {}),
        ...(mobile !== undefined ? { mobile } : {}),
        ...(address !== undefined ? { address } : {}),
        ...(profilePhoto !== undefined ? { profilePhoto } : {}),
        ...(upiId !== undefined ? { upiId } : {}),
        ...(bankDetails !== undefined
          ? {
              bankDetails: bankDetails
                ? JSON.parse(JSON.stringify(bankDetails))
                : null,
            }
          : {}),
      },
    });

    // Write audit log
    await this.auditService.logAction({
      actorId: actorId || memberId,
      actorRole: actorRole || updatedMember.role,
      actionType: 'UPDATE_MEMBER_PROFILE',
      entityType: 'Member',
      entityId: updatedMember.id,
      metadata: {
        updatedFields: Object.keys(updateDto),
      },
    });

    await this.dashboardCacheService?.invalidateMemberCache();
    return this.mapToResponseDto(updatedMember);
  }

  /**
   * Updates profile photo URL and recalculates completion status.
   */
  async updateProfilePhoto(
    memberId: string,
    photoUrl: string,
  ): Promise<MemberResponseDto> {
    const member = await this.prisma.member.findUnique({
      where: { id: memberId },
    });
    if (!member) {
      throw new NotFoundException(`Member with ID '${memberId}' not found`);
    }

    const updatedMember = await this.prisma.member.update({
      where: { id: memberId },
      data: {
        profilePhoto: photoUrl,
      },
    });

    if (this.auditService) {
      await this.auditService.logAction({
        actorId: memberId,
        actorRole: updatedMember.role,
        actionType: 'UPDATE_PROFILE_PHOTO',
        entityType: 'Member',
        entityId: updatedMember.id,
        metadata: { profilePhoto: photoUrl },
      });
    }

    await this.dashboardCacheService?.invalidateMemberCache();
    return this.mapToResponseDto(updatedMember);
  }

  /**
   * Dedicated audited endpoint to update member UPI details.
   */
  async updateUpi(
    memberId: string,
    dto: UpdateUpiDto,
    actorId?: string,
    actorRole?: MemberRole,
  ): Promise<MemberResponseDto> {
    const member = await this.prisma.member.findUnique({
      where: { id: memberId },
    });
    if (!member) {
      throw new NotFoundException(`Member with ID '${memberId}' not found`);
    }

    const existingBankDetails =
      (member.bankDetails as Record<string, any>) || {};
    const updatedBankDetails = {
      ...existingBankDetails,
      upiId: dto.upiId,
      upiName: dto.upiName || existingBankDetails.upiName || member.name,
    };

    const updatedMember = await this.prisma.member.update({
      where: { id: memberId },
      data: {
        bankDetails: JSON.parse(JSON.stringify(updatedBankDetails)),
      },
    });

    // Write audit log for sensitive UPI change
    await this.auditService.logAction({
      actorId: actorId || memberId,
      actorRole: actorRole || updatedMember.role,
      actionType: 'UPDATE_MEMBER_UPI',
      entityType: 'Member',
      entityId: updatedMember.id,
      metadata: {
        upiId: dto.upiId,
        upiName: dto.upiName,
      },
    });

    await this.dashboardCacheService?.invalidateMemberCache();
    return this.mapToResponseDto(updatedMember);
  }

  /**
   * Change member password scoped to self.
   */
  async changeMemberPassword(
    memberId: string,
    dto: MemberChangePasswordDto,
    actorId?: string,
    actorRole?: MemberRole,
  ): Promise<{ message: string }> {
    const member = await this.prisma.member.findUnique({
      where: { id: memberId },
    });
    if (!member) {
      throw new NotFoundException(`Member with ID '${memberId}' not found`);
    }

    const currentPwd = dto.currentPassword || dto.oldPassword;
    if (!currentPwd) {
      throw new BadRequestException('Current password is required');
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      currentPwd,
      member.passwordHash,
    );
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password does not match');
    }

    const newPasswordHash = await bcrypt.hash(
      dto.newPassword,
      this.BCRYPT_SALT_ROUNDS,
    );

    await this.prisma.member.update({
      where: { id: memberId },
      data: { passwordHash: newPasswordHash },
    });

    // Write audit log for security password change
    await this.auditService.logAction({
      actorId: actorId || memberId,
      actorRole: actorRole || member.role,
      actionType: 'CHANGE_MEMBER_PASSWORD',
      entityType: 'Member',
      entityId: member.id,
      metadata: {
        memberCode: member.memberCode,
      },
    });

    return { message: 'Password changed successfully' };
  }

  private mapToResponseDto(member: any): MemberResponseDto {
    const { passwordHash, ...result } = member;
    return result as MemberResponseDto;
  }
}
