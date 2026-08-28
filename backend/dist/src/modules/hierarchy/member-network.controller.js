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
exports.MemberNetworkController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const hierarchy_service_1 = require("./hierarchy.service");
const get_hierarchy_query_dto_1 = require("./dto/get-hierarchy-query.dto");
const search_downline_query_dto_1 = require("./dto/search-downline-query.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
let MemberNetworkController = class MemberNetworkController {
    hierarchyService;
    constructor(hierarchyService) {
        this.hierarchyService = hierarchyService;
    }
    async getDirectReferrals(memberId) {
        return this.hierarchyService.getDownline(memberId, 1);
    }
    async getDownline(memberId, query) {
        const levels = query.maxLevels || 20;
        const includeSelf = query.includeSelf !== false;
        return this.hierarchyService.getDownline(memberId, levels, includeSelf);
    }
    async getNetworkSummary(memberId, query) {
        const levels = query.maxLevels || 20;
        return this.hierarchyService.getHierarchySummary(memberId, levels);
    }
    async searchDownline(memberId, query) {
        return this.hierarchyService.searchDownline(memberId, query);
    }
};
exports.MemberNetworkController = MemberNetworkController;
__decorate([
    (0, common_1.Get)('direct-referrals'),
    (0, swagger_1.ApiOperation)({
        summary: 'GET /member/network/direct-referrals — View level-1 direct referrals only',
        description: 'Fetches direct referrals (Level 1 only) sponsored by the logged-in member. Root is strictly enforced server-side from JWT.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Level 1 direct referrals list returned successfully',
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MemberNetworkController.prototype, "getDirectReferrals", null);
__decorate([
    (0, common_1.Get)('downline'),
    (0, swagger_1.ApiOperation)({
        summary: 'GET /member/network/downline — View full downline up to 20 levels',
        description: 'Fetches level-tagged downline network up to 20 levels for the logged-in member as root. Root is strictly enforced server-side from JWT.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Level-tagged downline tree nodes array',
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, get_hierarchy_query_dto_1.GetHierarchyQueryDto]),
    __metadata("design:returntype", Promise)
], MemberNetworkController.prototype, "getDownline", null);
__decorate([
    (0, common_1.Get)('summary'),
    (0, swagger_1.ApiOperation)({
        summary: 'GET /member/network/summary — View personal network summary dashboard',
        description: 'Returns total downline metrics, active vs inactive counts, branch counts, and level breakdown for the logged-in member as root.',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Personal network summary object' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, get_hierarchy_query_dto_1.GetHierarchyQueryDto]),
    __metadata("design:returntype", Promise)
], MemberNetworkController.prototype, "getNetworkSummary", null);
__decorate([
    (0, common_1.Get)('search'),
    (0, swagger_1.ApiOperation)({
        summary: 'GET /member/network/search — Search within own downline network',
        description: 'Filters downline nodes strictly under the logged-in member by matching query against name, code, mobile, or email.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Matching downline hierarchy nodes array',
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, search_downline_query_dto_1.SearchDownlineQueryDto]),
    __metadata("design:returntype", Promise)
], MemberNetworkController.prototype, "searchDownline", null);
exports.MemberNetworkController = MemberNetworkController = __decorate([
    (0, swagger_1.ApiTags)('Member Network Visibility'),
    (0, common_1.Controller)('member/network'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [hierarchy_service_1.HierarchyService])
], MemberNetworkController);
//# sourceMappingURL=member-network.controller.js.map