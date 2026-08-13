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
exports.MemberEarningsMembershipController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const reports_service_1 = require("./reports.service");
const query_member_earnings_dto_1 = require("./dto/query-member-earnings.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
let MemberEarningsMembershipController = class MemberEarningsMembershipController {
    reportsService;
    constructor(reportsService) {
        this.reportsService = reportsService;
    }
    async getMyMembershipEarnings(memberId, query) {
        return this.reportsService.getMemberEarnings(memberId, query);
    }
};
exports.MemberEarningsMembershipController = MemberEarningsMembershipController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'GET /member/earnings/membership — Member self-service earnings',
        description: 'Fetches membership commission earnings ledgers scoped strictly to the authenticated user ID (from JWT payload req.user.sub).',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Authenticated member membership earnings list and personal summary' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, query_member_earnings_dto_1.QueryMemberEarningsDto]),
    __metadata("design:returntype", Promise)
], MemberEarningsMembershipController.prototype, "getMyMembershipEarnings", null);
exports.MemberEarningsMembershipController = MemberEarningsMembershipController = __decorate([
    (0, swagger_1.ApiTags)('Member Self-Service Earnings Reports'),
    (0, common_1.Controller)('member/earnings/membership'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [reports_service_1.ReportsService])
], MemberEarningsMembershipController);
//# sourceMappingURL=member-earnings-membership.controller.js.map