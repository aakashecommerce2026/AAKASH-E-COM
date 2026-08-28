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
exports.MembershipCommissionController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const membership_commission_service_1 = require("./membership-commission.service");
const membership_commission_config_dto_1 = require("./dto/membership-commission-config.dto");
const query_membership_commission_dto_1 = require("./dto/query-membership-commission.dto");
const membership_commission_response_dto_1 = require("./dto/membership-commission-response.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
let MembershipCommissionController = class MembershipCommissionController {
    membershipCommissionService;
    constructor(membershipCommissionService) {
        this.membershipCommissionService = membershipCommissionService;
    }
    async getConfig(version) {
        return this.membershipCommissionService.getActiveConfig(version ? Number(version) : undefined);
    }
    async createConfig(dto, actorId) {
        return this.membershipCommissionService.publishConfigVersion(dto, actorId);
    }
    async findAll(query) {
        return this.membershipCommissionService.findAll(query);
    }
    async findById(id) {
        return this.membershipCommissionService.findById(id);
    }
    async triggerRegistrationCommission(memberId, packageAmount) {
        const amount = packageAmount ? Number(packageAmount) : 10000;
        return this.membershipCommissionService.calculateForNewMember(memberId, amount);
    }
};
exports.MembershipCommissionController = MembershipCommissionController;
__decorate([
    (0, common_1.Get)('config'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get active 20-level membership commission rate configuration table',
        description: 'Fetches the active version (or specified version) 20-level percentage schedule from database configuration.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Active 20-level commission percentage table',
        type: [membership_commission_config_dto_1.MembershipCommissionConfigResponseDto],
    }),
    __param(0, (0, common_1.Query)('version')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], MembershipCommissionController.prototype, "getConfig", null);
__decorate([
    (0, common_1.Post)('config'),
    (0, roles_decorator_1.Roles)(client_1.MemberRole.ADMIN),
    (0, swagger_1.ApiOperation)({
        summary: 'Publish a versioned 20-level commission rate configuration (Admin only)',
        description: 'Stores a new versioned 20-level percentage schedule in DB. Deactivates older active versions if isActive is true, making future rate updates safe without code edits.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Commission configuration created and activated successfully',
        type: [membership_commission_config_dto_1.MembershipCommissionConfigResponseDto],
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [membership_commission_config_dto_1.CreateCommissionConfigDto, String]),
    __metadata("design:returntype", Promise)
], MembershipCommissionController.prototype, "createConfig", null);
__decorate([
    (0, common_1.Get)('ledger'),
    (0, swagger_1.ApiOperation)({
        summary: 'Query membership commission ledgers',
        description: 'Lists membership commission ledgers filtered by sourceMemberId, beneficiaryMemberId, level, status, or date.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Paginated membership commission ledger records',
    }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_membership_commission_dto_1.QueryMembershipCommissionDto]),
    __metadata("design:returntype", Promise)
], MembershipCommissionController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('ledger/:id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get single membership commission ledger by ID',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Commission ledger UUID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        type: membership_commission_response_dto_1.MembershipCommissionResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Ledger not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MembershipCommissionController.prototype, "findById", null);
__decorate([
    (0, common_1.Post)('trigger/:memberId'),
    (0, roles_decorator_1.Roles)(client_1.MemberRole.ADMIN, client_1.MemberRole.SUB_ADMIN),
    (0, swagger_1.ApiOperation)({
        summary: 'Manually trigger or re-process 20-level registration commission engine for a member (Admin)',
        description: 'Walks up the 20-level referral tree for target memberId and calculates membership commission ledgers if not already present.',
    }),
    (0, swagger_1.ApiParam)({
        name: 'memberId',
        description: 'UUID of the newly registered member',
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Commission ledgers generated successfully',
        type: [membership_commission_response_dto_1.MembershipCommissionResponseDto],
    }),
    __param(0, (0, common_1.Param)('memberId')),
    __param(1, (0, common_1.Query)('packageAmount')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], MembershipCommissionController.prototype, "triggerRegistrationCommission", null);
exports.MembershipCommissionController = MembershipCommissionController = __decorate([
    (0, swagger_1.ApiTags)('Membership Commission Engine & Config'),
    (0, common_1.Controller)('membership-commissions'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [membership_commission_service_1.MembershipCommissionService])
], MembershipCommissionController);
//# sourceMappingURL=membership-commission.controller.js.map