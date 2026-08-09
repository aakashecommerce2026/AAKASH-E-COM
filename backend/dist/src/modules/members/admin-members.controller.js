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
exports.AdminMembersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const members_service_1 = require("./members.service");
const create_admin_member_dto_1 = require("./dto/create-admin-member.dto");
const update_member_dto_1 = require("./dto/update-member.dto");
const query_members_dto_1 = require("./dto/query-members.dto");
const member_response_dto_1 = require("./dto/member-response.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
let AdminMembersController = class AdminMembersController {
    membersService;
    constructor(membersService) {
        this.membersService = membersService;
    }
    async createMember(dto) {
        return this.membersService.createByAdmin(dto);
    }
    async updateMember(id, dto) {
        return this.membersService.update(id, dto);
    }
    async getMembers(query) {
        return this.membersService.findAll(query);
    }
    async getMemberById(id) {
        return this.membersService.findByIdWithReferrer(id);
    }
    async getMemberReferrer(id) {
        return this.membersService.getReferrerInfo(id);
    }
    async getMemberDownlinePreview(id) {
        return this.membersService.getDownlinePreview(id);
    }
};
exports.AdminMembersController = AdminMembersController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({
        summary: 'Create member (Admin), auto-generate memberCode & temp password if missing, link active referrer',
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Member created successfully', type: member_response_dto_1.MemberResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Validation error or invalid active referrer' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Member code, mobile, or email collision' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_admin_member_dto_1.CreateAdminMemberDto]),
    __metadata("design:returntype", Promise)
], AdminMembersController.prototype, "createMember", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Edit member details' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Member updated successfully', type: member_response_dto_1.MemberResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid data or self-referrer error' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Member not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_member_dto_1.UpdateMemberDto]),
    __metadata("design:returntype", Promise)
], AdminMembersController.prototype, "updateMember", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get paginated member list with search and filters' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Paginated members response' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_members_dto_1.QueryMembersDto]),
    __metadata("design:returntype", Promise)
], AdminMembersController.prototype, "getMembers", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'View single member details with populated referrer info' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Member profile with populated referrer' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Member not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminMembersController.prototype, "getMemberById", null);
__decorate([
    (0, common_1.Get)(':id/referrer'),
    (0, swagger_1.ApiOperation)({ summary: 'Get direct referrer member details for specified member ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Referrer profile details' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Member not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminMembersController.prototype, "getMemberReferrer", null);
__decorate([
    (0, common_1.Get)(':id/downline-preview'),
    (0, swagger_1.ApiOperation)({ summary: 'Get shallow (1-level) direct downline referrals preview for specified member ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Direct downline referrals list and summary counts' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Member not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminMembersController.prototype, "getMemberDownlinePreview", null);
exports.AdminMembersController = AdminMembersController = __decorate([
    (0, swagger_1.ApiTags)('Admin Members Management'),
    (0, common_1.Controller)('admin/members'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.MemberRole.ADMIN, client_1.MemberRole.SUB_ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [members_service_1.MembersService])
], AdminMembersController);
//# sourceMappingURL=admin-members.controller.js.map