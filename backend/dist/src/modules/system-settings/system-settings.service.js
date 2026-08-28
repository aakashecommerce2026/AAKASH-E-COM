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
var SystemSettingsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemSettingsService = exports.TDS_DEDUCTIONS_KEY = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
exports.TDS_DEDUCTIONS_KEY = 'TDS_DEDUCTIONS_ENABLED';
let SystemSettingsService = SystemSettingsService_1 = class SystemSettingsService {
    prisma;
    auditService;
    logger = new common_1.Logger(SystemSettingsService_1.name);
    constructor(prisma, auditService) {
        this.prisma = prisma;
        this.auditService = auditService;
    }
    async isTdsEnabled() {
        try {
            const setting = await this.prisma.systemSetting.findUnique({
                where: { key: exports.TDS_DEDUCTIONS_KEY },
            });
            if (!setting)
                return true;
            return setting.value === 'true';
        }
        catch {
            return true;
        }
    }
    async setTdsEnabled(enabled, actorId, actorRole) {
        const value = enabled ? 'true' : 'false';
        const setting = await this.prisma.systemSetting.upsert({
            where: { key: exports.TDS_DEDUCTIONS_KEY },
            update: {
                value,
                updatedBy: actorId || null,
                description: 'System-wide flag for TDS (5%) & Admin Fee (5%) statutory tax deductions',
            },
            create: {
                key: exports.TDS_DEDUCTIONS_KEY,
                value,
                updatedBy: actorId || null,
                description: 'System-wide flag for TDS (5%) & Admin Fee (5%) statutory tax deductions',
            },
        });
        await this.auditService.logAction({
            actorId: actorId || null,
            actorRole: actorRole || client_1.MemberRole.ADMIN,
            actionType: enabled ? 'ENABLE_TDS_DEDUCTIONS' : 'DISABLE_TDS_DEDUCTIONS',
            entityType: 'SystemSetting',
            entityId: setting.id,
            metadata: { enabled, value },
        });
        this.logger.log(`Statutory TDS deductions system setting updated: ENABLED = ${enabled}`);
        return {
            enabled,
            message: enabled
                ? 'Statutory tax deductions (5% TDS + 5% Admin fee) ENABLED system-wide.'
                : 'Statutory tax deductions (5% TDS + 5% Admin fee) DISABLED system-wide.',
        };
    }
};
exports.SystemSettingsService = SystemSettingsService;
exports.SystemSettingsService = SystemSettingsService = SystemSettingsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], SystemSettingsService);
//# sourceMappingURL=system-settings.service.js.map