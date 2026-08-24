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
exports.MemberActivityController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const member_portal_reports_service_1 = require("./member-portal-reports.service");
const query_member_activity_dto_1 = require("./dto/query-member-activity.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
let MemberActivityController = class MemberActivityController {
    memberPortalReportsService;
    constructor(memberPortalReportsService) {
        this.memberPortalReportsService = memberPortalReportsService;
    }
    async getMyActivityHistory(memberId, query) {
        return this.memberPortalReportsService.getActivityHistory(memberId, query);
    }
};
exports.MemberActivityController = MemberActivityController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'GET /member/activity — Scoped activity history feed',
        description: 'Fetches earnings activities, repurchase activities, distribution payout activities, and historical records scoped strictly to the logged-in member. Sorted most-recent-first and paginated.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Member activity history feed returned successfully',
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, query_member_activity_dto_1.QueryMemberActivityDto]),
    __metadata("design:returntype", Promise)
], MemberActivityController.prototype, "getMyActivityHistory", null);
exports.MemberActivityController = MemberActivityController = __decorate([
    (0, swagger_1.ApiTags)('Member Activity History'),
    (0, common_1.Controller)('member/activity'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [member_portal_reports_service_1.MemberPortalReportsService])
], MemberActivityController);
//# sourceMappingURL=member-activity.controller.js.map