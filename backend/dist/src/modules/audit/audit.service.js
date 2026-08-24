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
                    metadata: params.metadata
                        ? JSON.parse(JSON.stringify(params.metadata))
                        : undefined,
                },
            });
            this.logger.log(`[AUDIT LOG] ${params.actionType} on ${params.entityType}:${params.entityId || 'N/A'} by ${params.actorId || 'SYSTEM'} (${params.actorRole || 'N/A'})`);
            if (this.dashboardCacheService) {
                if (params.entityType === 'Member' ||
                    params.actionType.includes('MEMBER')) {
                    await this.dashboardCacheService.invalidateMemberCache();
                }
                else if (params.entityType === 'RepurchaseEntry' ||
                    params.actionType.includes('REPURCHASE')) {
                    await this.dashboardCacheService.invalidateRepurchaseCache();
                }
                else if (params.entityType === 'DistributionBatch' ||
                    params.entityType === 'DistributionRecord' ||
                    params.actionType.includes('DISTRIBUTION')) {
                    await this.dashboardCacheService.invalidateDistributionCache();
                }
                else {
                    await this.dashboardCacheService.clearByPatterns([
                        'admin:dashboard:activity:*',
                    ]);
                }
            }
            return log;
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.logger.error(`Failed to write activity log: ${message}`);
        }
    }
    async getAuditLogs(query) {
        const { actorId, actorRole, actionType, entityType, entityId, startDate, endDate, search, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', } = query;
        const skip = (page - 1) * limit;
        const where = {};
        if (actorId)
            where.actorId = actorId;
        if (actorRole)
            where.actorRole = actorRole;
        if (actionType)
            where.actionType = actionType;
        if (entityType)
            where.entityType = entityType;
        if (entityId)
            where.entityId = entityId;
        if (startDate || endDate) {
            const createdAtFilter = {};
            if (startDate)
                createdAtFilter.gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                createdAtFilter.lte = end;
            }
            where.createdAt = createdAtFilter;
        }
        if (search && search.trim() !== '') {
            const term = search.trim();
            where.OR = [
                { actionType: { contains: term, mode: 'insensitive' } },
                { entityType: { contains: term, mode: 'insensitive' } },
            ];
        }
        const validSortFields = ['createdAt', 'actionType', 'entityType'];
        const orderByField = validSortFields.includes(sortBy)
            ? sortBy
            : 'createdAt';
        const [total, logs] = await Promise.all([
            this.prisma.activityLog.count({ where }),
            this.prisma.activityLog.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [orderByField]: sortOrder },
                include: {
                    actor: {
                        select: {
                            id: true,
                            memberCode: true,
                            name: true,
                            role: true,
                        },
                    },
                },
            }),
        ]);
        return {
            data: logs,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
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