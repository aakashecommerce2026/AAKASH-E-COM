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
const reports_service_1 = require("./reports.service");
const query_member_earnings_dto_1 = require("./dto/query-member-earnings.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
let MemberEarningsRepurchaseController = class MemberEarningsRepurchaseController {
    reportsService;
    constructor(reportsService) {
        this.reportsService = reportsService;
    }
    async getMemberRepurchaseEarnings(loggedInUserId, query) {
        return this.reportsService.getMemberRepurchaseEarnings(loggedInUserId, query);
    }
};
exports.MemberEarningsRepurchaseController = MemberEarningsRepurchaseController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'GET /member/earnings/repurchase — Logged-in member repurchase earnings history',
        description: 'Returns paginated list of repurchase commission ledgers earned by the logged-in member, scoped strictly by JWT payload member ID.',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Member repurchase earnings list and summary totals' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, query_member_earnings_dto_1.QueryMemberEarningsDto]),
    __metadata("design:returntype", Promise)
], MemberEarningsRepurchaseController.prototype, "getMemberRepurchaseEarnings", null);
exports.MemberEarningsRepurchaseController = MemberEarningsRepurchaseController = __decorate([
    (0, swagger_1.ApiTags)('Member Repurchase Earnings'),
    (0, common_1.Controller)('member/earnings/repurchase'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [reports_service_1.ReportsService])
], MemberEarningsRepurchaseController);
//# sourceMappingURL=member-earnings-repurchase.controller.js.map