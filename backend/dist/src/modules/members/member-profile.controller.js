"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemberProfileController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const member_profile_service_1 = require("./member-profile.service");
const update_member_profile_dto_1 = require("./dto/update-member-profile.dto");
const update_upi_dto_1 = require("./dto/update-upi.dto");
const member_change_password_dto_1 = require("./dto/member-change-password.dto");
const member_response_dto_1 = require("./dto/member-response.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const ownership_guard_1 = require("../auth/guards/ownership.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
let MemberProfileController = class MemberProfileController {
    memberProfileService;
    constructor(memberProfileService) {
        this.memberProfileService = memberProfileService;
    }
    async getProfile(memberId) {
        return this.memberProfileService.getProfile(memberId);
    }
    async updateProfile(memberId, role, updateDto) {
        return this.memberProfileService.updateProfile(memberId, updateDto, memberId, role);
    }
    async updateUpi(memberId, role, updateUpiDto) {
        return this.memberProfileService.updateUpi(memberId, updateUpiDto, memberId, role);
    }
    async changePassword(memberId, role, changePasswordDto) {
        return this.memberProfileService.changeMemberPassword(memberId, changePasswordDto, memberId, role);
    }
};
exports.MemberProfileController = MemberProfileController;
__decorate([
    (0, common_1.Get)('profile'),
    (0, swagger_1.ApiOperation)({
        summary: 'GET /member/profile — View own member profile',
        description: 'Returns profile details strictly for the authenticated member derived from the JWT token.',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, type: member_response_dto_1.MemberResponseDto, description: 'Profile details returned successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MemberProfileController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Put)('profile'),
    (0, swagger_1.ApiOperation)({
        summary: 'PUT /member/profile — Update personal and contact information',
        description: 'Updates name, email, mobile, address, and bankDetails with validation and unique field conflict checks. Audited to activity_logs.',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, type: member_response_dto_1.MemberResponseDto, description: 'Profile updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Validation error' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Mobile number or Email address is already taken' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('role')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_member_profile_dto_1.UpdateMemberProfileDto]),
    __metadata("design:returntype", Promise)
], MemberProfileController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Put)('profile/upi'),
    (0, swagger_1.ApiOperation)({
        summary: 'PUT /member/profile/upi — Update sensitive UPI details',
        description: 'Audited dedicated endpoint to update member UPI VPA handle and registered account name inside bankDetails.',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, type: member_response_dto_1.MemberResponseDto, description: 'UPI details updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Validation error' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('role')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_upi_dto_1.UpdateUpiDto]),
    __metadata("design:returntype", Promise)
], MemberProfileController.prototype, "updateUpi", null);
__decorate([
    (0, common_1.Put)('change-password'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'PUT /member/change-password — Change password for authenticated member',
        description: 'Verifies current password, hashes new password with 12 salt rounds, and logs security change event to activity_logs.',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Password changed successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Current password does not match' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('role')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, member_change_password_dto_1.MemberChangePasswordDto]),
    __metadata("design:returntype", Promise)
], MemberProfileController.prototype, "changePassword", null);
exports.MemberProfileController = MemberProfileController = __decorate([
    (0, swagger_1.ApiTags)('Member Profile Management'),
    (0, common_1.Controller)('member'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, ownership_guard_1.OwnershipGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [member_profile_service_1.MemberProfileService])
], MemberProfileController);
//# sourceMappingURL=member-profile.controller.js.map