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
exports.AdminEarningsRepurchaseController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const reports_service_1 = require("./reports.service");
const query_admin_repurchase_earnings_dto_1 = require("./dto/query-admin-repurchase-earnings.dto");
const query_earnings_aggregation_dto_1 = require("./dto/query-earnings-aggregation.dto");
const query_member_wise_earnings_dto_1 = require("./dto/query-member-wise-earnings.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
let AdminEarningsRepurchaseController = class AdminEarningsRepurchaseController {
    reportsService;
    constructor(reportsService) {
        this.reportsService = reportsService;
    }
    async getAdminRepurchaseEarnings(query) {
        return this.reportsService.getAdminRepurchaseEarnings(query);
    }
    async getLevelWiseRepurchaseEarnings(query) {
        return this.reportsService.getLevelWiseRepurchaseEarnings(query);
    }
    async getMemberWiseRepurchaseEarnings(query) {
        return this.reportsService.getMemberWiseRepurchaseEarnings(query);
    }
};
exports.AdminEarningsRepurchaseController = AdminEarningsRepurchaseController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'GET /admin/earnings/repurchase — List repurchase earnings with filters & summary',
        description: 'Lists repurchase commission ledgers filtered by date range, memberId, level, status, or source/beneficiary member.',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Paginated repurchase earnings report with summary totals' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_admin_repurchase_earnings_dto_1.QueryAdminRepurchaseEarningsDto]),
    __metadata("design:returntype", Promise)
], AdminEarningsRepurchaseController.prototype, "getAdminRepurchaseEarnings", null);
__decorate([
    (0, common_1.Get)('level-wise'),
    (0, swagger_1.ApiOperation)({
        summary: 'GET /admin/earnings/repurchase/level-wise — Level-wise repurchase earnings aggregation',
        description: 'Returns level-wise breakdown of gross payouts, pending, hold, disbursed, and cancelled amounts across levels 1 to 20.',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '20-level repurchase earnings aggregation array' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_earnings_aggregation_dto_1.QueryEarningsAggregationDto]),
    __metadata("design:returntype", Promise)
], AdminEarningsRepurchaseController.prototype, "getLevelWiseRepurchaseEarnings", null);
__decorate([
    (0, common_1.Get)('member-wise'),
    (0, swagger_1.ApiOperation)({
        summary: 'GET /admin/earnings/repurchase/member-wise — Member-wise repurchase earnings aggregation',
        description: 'Returns aggregated repurchase earnings grouped by beneficiary member, sorted by highest gross earnings.',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Paginated member-wise repurchase earnings aggregation' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_member_wise_earnings_dto_1.QueryMemberWiseEarningsDto]),
    __metadata("design:returntype", Promise)
], AdminEarningsRepurchaseController.prototype, "getMemberWiseRepurchaseEarnings", null);
exports.AdminEarningsRepurchaseController = AdminEarningsRepurchaseController = __decorate([
    (0, swagger_1.ApiTags)('Admin Repurchase Earnings Reports'),
    (0, common_1.Controller)('admin/earnings/repurchase'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.MemberRole.ADMIN, client_1.MemberRole.SUB_ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [reports_service_1.ReportsService])
], AdminEarningsRepurchaseController);
//# sourceMappingURL=admin-earnings-repurchase.controller.js.map