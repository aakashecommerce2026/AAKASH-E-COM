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
exports.DashboardController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const dashboard_service_1 = require("./dashboard.service");
const query_dashboard_dto_1 = require("./dto/query-dashboard.dto");
const query_activity_dto_1 = require("./dto/query-activity.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
let DashboardController = class DashboardController {
    dashboardService;
    constructor(dashboardService) {
        this.dashboardService = dashboardService;
    }
    async getMemberStats(query) {
        return this.dashboardService.getMemberStats(query);
    }
    async getEarningsStats(query) {
        return this.dashboardService.getEarningsStats(query);
    }
    async getBusinessStats(query) {
        return this.dashboardService.getBusinessStats(query);
    }
    async getActivityFeed(query) {
        return this.dashboardService.getActivityFeed(query);
    }
};
exports.DashboardController = DashboardController;
__decorate([
    (0, common_1.Get)('members'),
    (0, swagger_1.ApiOperation)({
        summary: 'GET /admin/dashboard/members — Total members, joined today/week/month (date-truncated queries)',
        description: 'Provides aggregated member counts, date-truncated registration stats for today/this week/this month, status breakdown, and daily trends.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Member aggregation statistics returned successfully',
    }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_dashboard_dto_1.QueryDashboardDto]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getMemberStats", null);
__decorate([
    (0, common_1.Get)('earnings'),
    (0, swagger_1.ApiOperation)({
        summary: 'GET /admin/dashboard/earnings — Total membership/repurchase earnings, total distributed, pending distributions',
        description: 'Provides total membership commission earnings, repurchase commission earnings, total distributed net payout, and pending distribution metrics.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Earnings aggregation statistics returned successfully',
    }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_dashboard_dto_1.QueryDashboardDto]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getEarningsStats", null);
__decorate([
    (0, common_1.Get)('business'),
    (0, swagger_1.ApiOperation)({
        summary: 'GET /admin/dashboard/business — Repurchase summary, growth summary, earnings summary combined view',
        description: 'Provides unified business executive dashboard view combining repurchase metrics, growth metrics, and earnings/distribution metrics.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Combined business overview statistics returned successfully',
    }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_dashboard_dto_1.QueryDashboardDto]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getBusinessStats", null);
__decorate([
    (0, common_1.Get)('activity'),
    (0, swagger_1.ApiOperation)({
        summary: 'GET /admin/dashboard/activity — Unified paginated activity feed (recent registrations, repurchases, distributions, system activities)',
        description: 'Provides a unified, real-time, paginated activity feed aggregated across registrations, repurchase transactions, distribution payout runs, and audit logs.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Paginated activity feed returned successfully',
    }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_activity_dto_1.QueryActivityDto]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getActivityFeed", null);
exports.DashboardController = DashboardController = __decorate([
    (0, swagger_1.ApiTags)('Admin Dashboard Aggregations'),
    (0, common_1.Controller)('admin/dashboard'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.MemberRole.ADMIN, client_1.MemberRole.SUB_ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [dashboard_service_1.DashboardService])
], DashboardController);
//# sourceMappingURL=dashboard.controller.js.map