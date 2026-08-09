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
exports.HierarchyController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const hierarchy_service_1 = require("./hierarchy.service");
const get_hierarchy_query_dto_1 = require("./dto/get-hierarchy-query.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
let HierarchyController = class HierarchyController {
    hierarchyService;
    constructor(hierarchyService) {
        this.hierarchyService = hierarchyService;
    }
    async getDownline(memberId, query) {
        const levels = query.maxLevels || 20;
        return this.hierarchyService.getDownline(memberId, levels);
    }
    async getDirectReferrals(memberId) {
        return this.hierarchyService.getDownline(memberId, 1);
    }
    async getUpline(memberId, query) {
        const levels = query.maxLevels || 20;
        return this.hierarchyService.getUpline(memberId, levels);
    }
};
exports.HierarchyController = HierarchyController;
__decorate([
    (0, common_1.Get)(':memberId/downline'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get level-tagged recursive downline tree for a member (parameterized depth, max 20 levels)',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Level-tagged downline tree nodes array' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Member not found' }),
    __param(0, (0, common_1.Param)('memberId')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, get_hierarchy_query_dto_1.GetHierarchyQueryDto]),
    __metadata("design:returntype", Promise)
], HierarchyController.prototype, "getDownline", null);
__decorate([
    (0, common_1.Get)(':memberId/direct-referrals'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get Level-1 direct referrals only for specified member ID',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Level-1 direct referrals list' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Member not found' }),
    __param(0, (0, common_1.Param)('memberId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], HierarchyController.prototype, "getDirectReferrals", null);
__decorate([
    (0, common_1.Get)(':memberId/upline'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get recursive upline chain from target member up to root sponsor (internal/admin debugging)',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Level-tagged upline referral chain array' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Member not found' }),
    __param(0, (0, common_1.Param)('memberId')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, get_hierarchy_query_dto_1.GetHierarchyQueryDto]),
    __metadata("design:returntype", Promise)
], HierarchyController.prototype, "getUpline", null);
exports.HierarchyController = HierarchyController = __decorate([
    (0, swagger_1.ApiTags)('Admin Hierarchy Traversal'),
    (0, common_1.Controller)('admin/hierarchy'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.MemberRole.ADMIN, client_1.MemberRole.SUB_ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [hierarchy_service_1.HierarchyService])
], HierarchyController);
//# sourceMappingURL=hierarchy.controller.js.map