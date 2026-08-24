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
exports.PromotionsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const client_1 = require("@prisma/client");
const promotions_service_1 = require("./promotions.service");
let PromotionsController = class PromotionsController {
    promotionsService;
    constructor(promotionsService) {
        this.promotionsService = promotionsService;
    }
    async getMyStatus(req) {
        const memberId = req.user.sub || req.user.id;
        return this.promotionsService.getPromotionProgress(memberId);
    }
    async getMemberProgress(memberId, req) {
        const actorId = req.user.sub || req.user.id;
        const actorRole = req.user.role;
        if (actorRole !== client_1.MemberRole.ADMIN && actorRole !== client_1.MemberRole.SUB_ADMIN && actorId !== memberId) {
            throw new common_1.ForbiddenException('Access denied to other member promotion records');
        }
        return this.promotionsService.getPromotionProgress(memberId);
    }
    async recalculateAllRanks() {
        return this.promotionsService.recalculateAllMemberRanks();
    }
};
exports.PromotionsController = PromotionsController;
__decorate([
    (0, common_1.Get)('my-status'),
    (0, swagger_1.ApiOperation)({ summary: 'Get logged in member promotion rank status and progress' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PromotionsController.prototype, "getMyStatus", null);
__decorate([
    (0, common_1.Get)('progress/:memberId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get promotion progress and rank history for a specific member' }),
    __param(0, (0, common_1.Param)('memberId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PromotionsController.prototype, "getMemberProgress", null);
__decorate([
    (0, common_1.Post)('admin/recalculate'),
    (0, roles_decorator_1.Roles)(client_1.MemberRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Bulk recalculate and update ranks for all members (Admin only)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PromotionsController.prototype, "recalculateAllRanks", null);
exports.PromotionsController = PromotionsController = __decorate([
    (0, swagger_1.ApiTags)('Member Promotions'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('promotions'),
    __metadata("design:paramtypes", [promotions_service_1.PromotionsService])
], PromotionsController);
//# sourceMappingURL=promotions.controller.js.map