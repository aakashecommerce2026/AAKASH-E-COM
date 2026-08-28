"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DistributionModule = void 0;
const common_1 = require("@nestjs/common");
const bull_1 = require("@nestjs/bull");
const prisma_module_1 = require("../../prisma/prisma.module");
const audit_module_1 = require("../audit/audit.module");
const notifications_module_1 = require("../notifications/notifications.module");
const system_settings_module_1 = require("../system-settings/system-settings.module");
const distribution_service_1 = require("./distribution.service");
const admin_distribution_controller_1 = require("./admin-distribution.controller");
const distribution_processor_1 = require("./distribution.processor");
let DistributionModule = class DistributionModule {
};
exports.DistributionModule = DistributionModule;
exports.DistributionModule = DistributionModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            audit_module_1.AuditModule,
            notifications_module_1.NotificationsModule,
            system_settings_module_1.SystemSettingsModule,
            bull_1.BullModule.registerQueue({
                name: 'distribution-queue',
            }),
        ],
        controllers: [admin_distribution_controller_1.AdminDistributionController],
        providers: [distribution_service_1.DistributionService, distribution_processor_1.DistributionProcessor],
        exports: [distribution_service_1.DistributionService],
    })
], DistributionModule);
//# sourceMappingURL=distribution.module.js.map