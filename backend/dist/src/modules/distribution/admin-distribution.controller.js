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
exports.AdminDistributionController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const distribution_service_1 = require("./distribution.service");
const query_pending_distribution_dto_1 = require("./dto/query-pending-distribution.dto");
const process_distribution_batch_dto_1 = require("./dto/process-distribution-batch.dto");
const query_distribution_history_dto_1 = require("./dto/query-distribution-history.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
let AdminDistributionController = class AdminDistributionController {
    distributionService;
    constructor(distributionService) {
        this.distributionService = distributionService;
    }
    async getPendingCommissions(query) {
        return this.distributionService.getPendingCommissions(query);
    }
    async processBatch(dto, actorId, actorRole) {
        return this.distributionService.processDistributionBatch(dto, actorId, actorRole);
    }
    async getBatchHistory(query) {
        return this.distributionService.getBatchHistory(query);
    }
    async getBatchById(batchId) {
        return this.distributionService.getBatchById(batchId);
    }
};
exports.AdminDistributionController = AdminDistributionController;
__decorate([
    (0, common_1.Get)('pending'),
    (0, swagger_1.ApiOperation)({
        summary: 'GET /admin/distribution/pending — Aggregated view of all PENDING membership + repurchase commissions',
        description: 'Fetches pending membership and repurchase ledgers, grouped per beneficiary member with gross earnings, 5% TDS deduction, 5% Admin Fee deduction, net payable amount, and bank details.',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Paginated pending distribution report and summary totals' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_pending_distribution_dto_1.QueryPendingDistributionDto]),
    __metadata("design:returntype", Promise)
], AdminDistributionController.prototype, "getPendingCommissions", null);
__decorate([
    (0, common_1.Post)('process'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({
        summary: 'POST /admin/distribution/process — Execute payout batch processing run',
        description: 'Creates a distribution_batch, aggregates selected pending ledgers per member, calculates 5% TDS and 5% Admin Fee, marks ledgers as DISBURSED, and records the batch.',
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Distribution batch created and processed successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'No pending ledgers match criteria or validation error' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [process_distribution_batch_dto_1.ProcessDistributionBatchDto, String, String]),
    __metadata("design:returntype", Promise)
], AdminDistributionController.prototype, "processBatch", null);
__decorate([
    (0, common_1.Get)('history'),
    (0, swagger_1.ApiOperation)({
        summary: 'GET /admin/distribution/history — List past distribution batches with totals',
        description: 'Returns paginated list of past distribution batch execution runs with total member counts, gross/net amounts, status, and processor details.',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Paginated list of distribution batch history' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_distribution_history_dto_1.QueryDistributionHistoryDto]),
    __metadata("design:returntype", Promise)
], AdminDistributionController.prototype, "getBatchHistory", null);
__decorate([
    (0, common_1.Get)(':batchId'),
    (0, swagger_1.ApiOperation)({
        summary: 'GET /admin/distribution/:batchId — Single distribution batch details',
        description: 'Returns full detail view for a specific distribution batch by UUID or batchNo, including all member payout records and linked commission ledgers.',
    }),
    (0, swagger_1.ApiParam)({ name: 'batchId', description: 'Distribution Batch UUID or batchNo (e.g. BATCH-20260813-0001)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Distribution batch detail object' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Distribution batch not found' }),
    __param(0, (0, common_1.Param)('batchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminDistributionController.prototype, "getBatchById", null);
exports.AdminDistributionController = AdminDistributionController = __decorate([
    (0, swagger_1.ApiTags)('Admin Commission Distribution'),
    (0, common_1.Controller)('admin/distribution'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.MemberRole.ADMIN, client_1.MemberRole.SUB_ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [distribution_service_1.DistributionService])
], AdminDistributionController);
//# sourceMappingURL=admin-distribution.controller.js.map