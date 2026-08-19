import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { DashboardCacheService } from '../dashboard/dashboard-cache.service';
import { UpdateMemberProfileDto } from './dto/update-member-profile.dto';
import { UpdateUpiDto } from './dto/update-upi.dto';
import { MemberChangePasswordDto } from './dto/member-change-password.dto';
import { MemberResponseDto } from './dto/member-response.dto';
import { MemberRole } from '@prisma/client';
export declare class MemberProfileService {
    private readonly prisma;
    private readonly auditService;
    private readonly dashboardCacheService?;
    private readonly BCRYPT_SALT_ROUNDS;
    constructor(prisma: PrismaService, auditService: AuditService, dashboardCacheService?: DashboardCacheService | undefined);
    getProfile(memberId: string): Promise<MemberResponseDto>;
    updateProfile(memberId: string, updateDto: UpdateMemberProfileDto, actorId?: string, actorRole?: MemberRole): Promise<MemberResponseDto>;
    updateUpi(memberId: string, dto: UpdateUpiDto, actorId?: string, actorRole?: MemberRole): Promise<MemberResponseDto>;
    changeMemberPassword(memberId: string, dto: MemberChangePasswordDto, actorId?: string, actorRole?: MemberRole): Promise<{
        message: string;
    }>;
    private mapToResponseDto;
}
