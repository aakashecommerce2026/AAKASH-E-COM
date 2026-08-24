import { MemberRole } from '@prisma/client';
import { MemberProfileService } from './member-profile.service';
import { UpdateMemberProfileDto } from './dto/update-member-profile.dto';
import { UpdateUpiDto } from './dto/update-upi.dto';
import { MemberChangePasswordDto } from './dto/member-change-password.dto';
import { MemberResponseDto } from './dto/member-response.dto';
export declare class MemberProfileController {
    private readonly memberProfileService;
    constructor(memberProfileService: MemberProfileService);
    getProfile(memberId: string): Promise<MemberResponseDto>;
    uploadProfilePhoto(memberId: string, file: any): Promise<MemberResponseDto>;
    updateProfile(memberId: string, role: MemberRole, updateDto: UpdateMemberProfileDto): Promise<MemberResponseDto>;
    updateUpi(memberId: string, role: MemberRole, updateUpiDto: UpdateUpiDto): Promise<MemberResponseDto>;
    changePassword(memberId: string, role: MemberRole, changePasswordDto: MemberChangePasswordDto): Promise<{
        message: string;
    }>;
}
