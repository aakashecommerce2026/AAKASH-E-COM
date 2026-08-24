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
exports.MemberDashboardController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const dashboard_service_1 = require("./dashboard.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
let MemberDashboardController = class MemberDashboardController {
    dashboardService;
    constructor(dashboardService) {
        this.dashboardService = dashboardService;
    }
    async getMemberDashboard(memberId, refresh) {
        const isRefresh = String(refresh) === 'true' || refresh === true;
        return this.dashboardService.getMemberPersonalDashboard(memberId, isRefresh);
    }
};
exports.MemberDashboardController = MemberDashboardController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'GET /member/dashboard — Member Personal Dashboard',
        description: 'Provides aggregated metrics strictly for the authenticated member (total direct referrals, downline count, membership earnings, repurchase earnings, total earnings summary). Member ID is derived strictly from the JWT token.',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'refresh',
        required: false,
        type: Boolean,
        description: 'Bypass cache and force real-time calculation',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Member personal dashboard returned successfully',
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Query)('refresh')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Boolean]),
    __metadata("design:returntype", Promise)
], MemberDashboardController.prototype, "getMemberDashboard", null);
exports.MemberDashboardController = MemberDashboardController = __decorate([
    (0, swagger_1.ApiTags)('Member Dashboard'),
    (0, common_1.Controller)('member/dashboard'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [dashboard_service_1.DashboardService])
], MemberDashboardController);
//# sourceMappingURL=member-dashboard.controller.js.map