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
var AuditService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const dashboard_cache_service_1 = require("../dashboard/dashboard-cache.service");
let AuditService = AuditService_1 = class AuditService {
    prisma;
    dashboardCacheService;
    logger = new common_1.Logger(AuditService_1.name);
    constructor(prisma, dashboardCacheService) {
        this.prisma = prisma;
        this.dashboardCacheService = dashboardCacheService;
    }
    async logAction(params, txClient) {
        const db = txClient || this.prisma;
        try {
            const log = await db.activityLog.create({
                data: {
                    actorId: params.actorId || null,
                    actorRole: params.actorRole || null,
                    actionType: params.actionType,
                    entityType: params.entityType,
                    entityId: params.entityId || null,
                    metadata: params.metadata ? JSON.parse(JSON.stringify(params.metadata)) : undefined,
                },
            });
            this.logger.log(`[AUDIT LOG] ${params.actionType} on ${params.entityType}:${params.entityId || 'N/A'} by ${params.actorId || 'SYSTEM'} (${params.actorRole || 'N/A'})`);
            if (this.dashboardCacheService) {
                if (params.entityType === 'Member' || params.actionType.includes('MEMBER')) {
                    await this.dashboardCacheService.invalidateMemberCache();
                }
                else if (params.entityType === 'RepurchaseEntry' || params.actionType.includes('REPURCHASE')) {
                    await this.dashboardCacheService.invalidateRepurchaseCache();
                }
                else if (params.entityType === 'DistributionBatch' ||
                    params.entityType === 'DistributionRecord' ||
                    params.actionType.includes('DISTRIBUTION')) {
                    await this.dashboardCacheService.invalidateDistributionCache();
                }
                else {
                    await this.dashboardCacheService.clearByPatterns(['admin:dashboard:activity:*']);
                }
            }
            return log;
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.logger.error(`Failed to write activity log: ${message}`);
        }
    }
};
exports.AuditService = AuditService;
exports.AuditService = AuditService = AuditService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        dashboard_cache_service_1.DashboardCacheService])
], AuditService);
//# sourceMappingURL=audit.service.js.map