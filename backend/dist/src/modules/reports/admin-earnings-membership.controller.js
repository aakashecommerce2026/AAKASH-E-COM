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
exports.AdminEarningsMembershipController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const reports_service_1 = require("./reports.service");
const query_admin_membership_earnings_dto_1 = require("./dto/query-admin-membership-earnings.dto");
const query_earnings_aggregation_dto_1 = require("./dto/query-earnings-aggregation.dto");
const query_member_wise_earnings_dto_1 = require("./dto/query-member-wise-earnings.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
let AdminEarningsMembershipController = class AdminEarningsMembershipController {
    reportsService;
    constructor(reportsService) {
        this.reportsService = reportsService;
    }
    async getEarningsList(query) {
        return this.reportsService.getAdminMembershipEarnings(query);
    }
    async getLevelWiseEarnings(query) {
        return this.reportsService.getLevelWiseEarnings(query);
    }
    async getMemberWiseEarnings(query) {
        return this.reportsService.getMemberWiseEarnings(query);
    }
};
exports.AdminEarningsMembershipController = AdminEarningsMembershipController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'GET /admin/earnings/membership — List membership earnings ledgers with filters',
        description: 'Provides paginated membership commission earnings list with date range, member, level, and status filters plus overall summary metrics.',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Paginated earnings list and summary metrics' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_admin_membership_earnings_dto_1.QueryAdminMembershipEarningsDto]),
    __metadata("design:returntype", Promise)
], AdminEarningsMembershipController.prototype, "getEarningsList", null);
__decorate([
    (0, common_1.Get)('level-wise'),
    (0, swagger_1.ApiOperation)({
        summary: 'GET /admin/earnings/membership/level-wise — Level-wise earnings aggregation',
        description: 'Aggregates total earnings, ledger counts, and status breakdowns per level (levels 1..20).',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '20-level aggregated earnings table' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_earnings_aggregation_dto_1.QueryEarningsAggregationDto]),
    __metadata("design:returntype", Promise)
], AdminEarningsMembershipController.prototype, "getLevelWiseEarnings", null);
__decorate([
    (0, common_1.Get)('member-wise'),
    (0, swagger_1.ApiOperation)({
        summary: 'GET /admin/earnings/membership/member-wise — Member-wise earnings aggregation',
        description: 'Aggregates total membership commission earnings grouped by beneficiary member.',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Member-wise aggregated earnings response' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_member_wise_earnings_dto_1.QueryMemberWiseEarningsDto]),
    __metadata("design:returntype", Promise)
], AdminEarningsMembershipController.prototype, "getMemberWiseEarnings", null);
exports.AdminEarningsMembershipController = AdminEarningsMembershipController = __decorate([
    (0, swagger_1.ApiTags)('Admin Membership Earnings Reports'),
    (0, common_1.Controller)('admin/earnings/membership'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.MemberRole.ADMIN, client_1.MemberRole.SUB_ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [reports_service_1.ReportsService])
], AdminEarningsMembershipController);
//# sourceMappingURL=admin-earnings-membership.controller.js.map