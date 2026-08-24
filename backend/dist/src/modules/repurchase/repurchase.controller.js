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
exports.AdminRepurchaseController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const repurchase_service_1 = require("./repurchase.service");
const create_repurchase_entry_dto_1 = require("./dto/create-repurchase-entry.dto");
const update_repurchase_entry_dto_1 = require("./dto/update-repurchase-entry.dto");
const query_repurchase_entry_dto_1 = require("./dto/query-repurchase-entry.dto");
const repurchase_entry_response_dto_1 = require("./dto/repurchase-entry-response.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
let AdminRepurchaseController = class AdminRepurchaseController {
    repurchaseService;
    constructor(repurchaseService) {
        this.repurchaseService = repurchaseService;
    }
    async create(dto, actorId, actorRole) {
        return this.repurchaseService.create(dto, actorId, actorRole);
    }
    async findAll(query) {
        return this.repurchaseService.findAll(query);
    }
    async findById(id) {
        return this.repurchaseService.findById(id);
    }
    async update(id, dto, actorId, actorRole) {
        return this.repurchaseService.update(id, dto, actorId, actorRole);
    }
    async remove(id, actorId, actorRole) {
        return this.repurchaseService.remove(id, actorId, actorRole);
    }
};
exports.AdminRepurchaseController = AdminRepurchaseController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({
        summary: 'POST /admin/repurchase — Create in-store repurchase entry (Admin)',
        description: 'Creates an in-store repurchase transaction. Validates active member status, enforces DB-level transactionRef uniqueness (HTTP 409 on duplicate), and logs CREATE_REPURCHASE_ENTRY to activity_logs.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Repurchase entry created successfully',
        type: repurchase_entry_response_dto_1.RepurchaseEntryResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Validation error or member is not ACTIVE',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Member not found' }),
    (0, swagger_1.ApiResponse)({
        status: 409,
        description: 'Transaction reference collision (DB level P2002)',
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_repurchase_entry_dto_1.CreateRepurchaseEntryDto, String, String]),
    __metadata("design:returntype", Promise)
], AdminRepurchaseController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'GET /admin/repurchase — Paginated list with search by transaction_ref/member/date range',
        description: 'Lists repurchase entries filtered by memberId/memberCode, transactionRef/member search, or transaction date range (excluding soft-deleted items).',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Paginated repurchase entries response',
    }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_repurchase_entry_dto_1.QueryRepurchaseEntryDto]),
    __metadata("design:returntype", Promise)
], AdminRepurchaseController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'GET /admin/repurchase/:id — Detail view' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Repurchase Entry UUID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Repurchase entry details',
        type: repurchase_entry_response_dto_1.RepurchaseEntryResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Repurchase entry not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminRepurchaseController.prototype, "findById", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: 'PUT /admin/repurchase/:id — Edit entry (Locked once commission is generated)',
        description: 'Updates repurchase entry details before commission calculation. Once commissions are generated, entry is locked against editing and logs UPDATE_REPURCHASE_ENTRY to activity_logs.',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Repurchase Entry UUID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Repurchase entry updated successfully',
        type: repurchase_entry_response_dto_1.RepurchaseEntryResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Validation error, member not ACTIVE, or entry is locked post-commission',
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Repurchase entry or member not found',
    }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Transaction reference collision' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(3, (0, current_user_decorator_1.CurrentUser)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_repurchase_entry_dto_1.UpdateRepurchaseEntryDto, String, String]),
    __metadata("design:returntype", Promise)
], AdminRepurchaseController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: 'DELETE /admin/repurchase/:id — Soft delete (Allowed only before commission generation)',
        description: 'Soft-deletes repurchase entry (deletedAt timestamp). Allowed ONLY before commission generation. Logs DELETE_REPURCHASE_ENTRY to activity_logs.',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Repurchase Entry UUID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Repurchase entry soft-deleted successfully',
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Entry locked: commissions already generated',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Repurchase entry not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AdminRepurchaseController.prototype, "remove", null);
exports.AdminRepurchaseController = AdminRepurchaseController = __decorate([
    (0, swagger_1.ApiTags)('Admin In-Store Repurchase Entries'),
    (0, common_1.Controller)(['admin/repurchase', 'admin/repurchases', 'repurchases']),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.MemberRole.ADMIN, client_1.MemberRole.SUB_ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [repurchase_service_1.RepurchaseService])
], AdminRepurchaseController);
//# sourceMappingURL=repurchase.controller.js.map