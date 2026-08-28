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
exports.MemberRepurchaseController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const repurchase_service_1 = require("./repurchase.service");
const query_repurchase_entry_dto_1 = require("./dto/query-repurchase-entry.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
let MemberRepurchaseController = class MemberRepurchaseController {
    repurchaseService;
    constructor(repurchaseService) {
        this.repurchaseService = repurchaseService;
    }
    async getMyRepurchases(memberId, query) {
        return this.repurchaseService.findAll({ ...query, memberId });
    }
};
exports.MemberRepurchaseController = MemberRepurchaseController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'GET /member/repurchase — View own member repurchase transaction history',
        description: 'Returns paginated list of repurchase orders for the currently authenticated member.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Paginated list of member repurchase transactions',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, query_repurchase_entry_dto_1.QueryRepurchaseEntryDto]),
    __metadata("design:returntype", Promise)
], MemberRepurchaseController.prototype, "getMyRepurchases", null);
exports.MemberRepurchaseController = MemberRepurchaseController = __decorate([
    (0, swagger_1.ApiTags)('Member Repurchase History'),
    (0, common_1.Controller)(['member/repurchase', 'member/repurchases']),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [repurchase_service_1.RepurchaseService])
], MemberRepurchaseController);
//# sourceMappingURL=member-repurchase.controller.js.map