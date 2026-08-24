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
exports.MemberEarningsRepurchaseController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const member_portal_reports_service_1 = require("./member-portal-reports.service");
const query_member_earnings_breakdown_dto_1 = require("./dto/query-member-earnings-breakdown.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
let MemberEarningsRepurchaseController = class MemberEarningsRepurchaseController {
    memberPortalReportsService;
    constructor(memberPortalReportsService) {
        this.memberPortalReportsService = memberPortalReportsService;
    }
    async getMyRepurchaseEarnings(memberId, query) {
        return this.memberPortalReportsService.getRepurchaseEarningsBreakdown(memberId, query);
    }
};
exports.MemberEarningsRepurchaseController = MemberEarningsRepurchaseController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'GET /member/earnings/repurchase?range=daily|weekly|monthly — Repurchase earnings breakdown',
        description: 'Grouped aggregation queries on repurchase_commission_ledger scoped strictly to beneficiary_member_id = self derived from JWT payload.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Authenticated member repurchase earnings breakdown returned successfully',
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, query_member_earnings_breakdown_dto_1.QueryMemberEarningsBreakdownDto]),
    __metadata("design:returntype", Promise)
], MemberEarningsRepurchaseController.prototype, "getMyRepurchaseEarnings", null);
exports.MemberEarningsRepurchaseController = MemberEarningsRepurchaseController = __decorate([
    (0, swagger_1.ApiTags)('Member Self-Service Earnings Reports'),
    (0, common_1.Controller)('member/earnings/repurchase'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [member_portal_reports_service_1.MemberPortalReportsService])
], MemberEarningsRepurchaseController);
//# sourceMappingURL=member-earnings-repurchase.controller.js.map