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
exports.MemberEarningsTotalController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const member_portal_reports_service_1 = require("./member-portal-reports.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
let MemberEarningsTotalController = class MemberEarningsTotalController {
    memberPortalReportsService;
    constructor(memberPortalReportsService) {
        this.memberPortalReportsService = memberPortalReportsService;
    }
    async getMyTotalEarnings(memberId) {
        return this.memberPortalReportsService.getTotalEarningsSummary(memberId);
    }
};
exports.MemberEarningsTotalController = MemberEarningsTotalController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'GET /member/earnings/total — Combined total earnings summary',
        description: 'Aggregates combined membership earnings, repurchase earnings, total distributed payouts, and pending distributions scoped strictly to the authenticated member.',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Combined total earnings summary returned successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MemberEarningsTotalController.prototype, "getMyTotalEarnings", null);
exports.MemberEarningsTotalController = MemberEarningsTotalController = __decorate([
    (0, swagger_1.ApiTags)('Member Self-Service Earnings Reports'),
    (0, common_1.Controller)('member/earnings/total'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [member_portal_reports_service_1.MemberPortalReportsService])
], MemberEarningsTotalController);
//# sourceMappingURL=member-earnings-total.controller.js.map