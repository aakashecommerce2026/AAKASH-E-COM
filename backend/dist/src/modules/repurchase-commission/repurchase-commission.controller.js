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
exports.RepurchaseCommissionController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const repurchase_commission_service_1 = require("./repurchase-commission.service");
const repurchase_commission_config_dto_1 = require("./dto/repurchase-commission-config.dto");
const query_repurchase_commission_dto_1 = require("./dto/query-repurchase-commission.dto");
const repurchase_commission_response_dto_1 = require("./dto/repurchase-commission-response.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
let RepurchaseCommissionController = class RepurchaseCommissionController {
    repurchaseCommissionService;
    constructor(repurchaseCommissionService) {
        this.repurchaseCommissionService = repurchaseCommissionService;
    }
    async getConfig(version) {
        return this.repurchaseCommissionService.getActiveConfig(version ? Number(version) : undefined);
    }
    async updateConfig(dto, actorId) {
        return this.repurchaseCommissionService.updateConfig(dto, actorId);
    }
    async findAll(query, user) {
        if (user &&
            user.role !== client_1.MemberRole.ADMIN &&
            !query.beneficiaryMemberId &&
            !query.sourceMemberId) {
            query.beneficiaryMemberId = user.id;
        }
        return this.repurchaseCommissionService.findAll(query);
    }
    async findById(id) {
        return this.repurchaseCommissionService.findById(id);
    }
    async triggerRepurchaseCommission(repurchaseEntryId) {
        return this.repurchaseCommissionService.calculateForEntry(repurchaseEntryId);
    }
};
exports.RepurchaseCommissionController = RepurchaseCommissionController;
__decorate([
    (0, common_1.Get)('config'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get active 20-level repurchase commission rate configuration table',
        description: 'Fetches the active version (or specified version) 20-level percentage schedule for repurchase commissions.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Active 20-level repurchase commission percentage table',
        type: [repurchase_commission_config_dto_1.RepurchaseCommissionConfigResponseDto],
    }),
    __param(0, (0, common_1.Query)('version')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], RepurchaseCommissionController.prototype, "getConfig", null);
__decorate([
    (0, common_1.Post)('config'),
    (0, roles_decorator_1.Roles)(client_1.MemberRole.ADMIN),
    (0, swagger_1.ApiOperation)({
        summary: 'Publish a versioned 20-level repurchase commission rate configuration (Admin only)',
        description: 'Stores a new versioned 20-level percentage schedule in DB (must sum to EXACTLY 5.00%). Deactivates older active versions.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Repurchase commission configuration created and activated successfully',
        type: [repurchase_commission_config_dto_1.RepurchaseCommissionConfigResponseDto],
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [repurchase_commission_config_dto_1.UpdateRepurchaseCommissionConfigDto, String]),
    __metadata("design:returntype", Promise)
], RepurchaseCommissionController.prototype, "updateConfig", null);
__decorate([
    (0, common_1.Get)('ledger'),
    (0, swagger_1.ApiOperation)({
        summary: 'Query repurchase commission ledgers',
        description: 'Lists repurchase commission ledgers filtered by repurchaseEntryId, sourceMemberId, beneficiaryMemberId, level, or status.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Paginated repurchase commission ledger records',
    }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_repurchase_commission_dto_1.QueryRepurchaseCommissionDto, Object]),
    __metadata("design:returntype", Promise)
], RepurchaseCommissionController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('ledger/:id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get single repurchase commission ledger by ID',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Commission ledger UUID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        type: repurchase_commission_response_dto_1.RepurchaseCommissionResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Ledger not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RepurchaseCommissionController.prototype, "findById", null);
__decorate([
    (0, common_1.Post)('trigger/:repurchaseEntryId'),
    (0, roles_decorator_1.Roles)(client_1.MemberRole.ADMIN, client_1.MemberRole.SUB_ADMIN),
    (0, swagger_1.ApiOperation)({
        summary: 'Manually trigger or re-process 20-level repurchase commission engine for an entry (Admin)',
        description: 'Walks up the 20-level referral tree for target repurchaseEntryId and calculates repurchase commission ledgers.',
    }),
    (0, swagger_1.ApiParam)({
        name: 'repurchaseEntryId',
        description: 'UUID of the target repurchase entry',
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Repurchase commission ledgers generated successfully',
    }),
    __param(0, (0, common_1.Param)('repurchaseEntryId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RepurchaseCommissionController.prototype, "triggerRepurchaseCommission", null);
exports.RepurchaseCommissionController = RepurchaseCommissionController = __decorate([
    (0, swagger_1.ApiTags)('Repurchase Commission Engine & Config'),
    (0, common_1.Controller)('repurchase-commissions'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [repurchase_commission_service_1.RepurchaseCommissionService])
], RepurchaseCommissionController);
//# sourceMappingURL=repurchase-commission.controller.js.map