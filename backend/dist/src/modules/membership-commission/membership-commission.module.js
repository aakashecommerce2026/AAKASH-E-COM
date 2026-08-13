"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MembershipCommissionModule = void 0;
const common_1 = require("@nestjs/common");
const membership_commission_service_1 = require("./membership-commission.service");
const membership_commission_controller_1 = require("./membership-commission.controller");
const prisma_module_1 = require("../../prisma/prisma.module");
const audit_module_1 = require("../audit/audit.module");
let MembershipCommissionModule = class MembershipCommissionModule {
};
exports.MembershipCommissionModule = MembershipCommissionModule;
exports.MembershipCommissionModule = MembershipCommissionModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, audit_module_1.AuditModule],
        controllers: [membership_commission_controller_1.MembershipCommissionController],
        providers: [membership_commission_service_1.MembershipCommissionService],
        exports: [membership_commission_service_1.MembershipCommissionService],
    })
], MembershipCommissionModule);
//# sourceMappingURL=membership-commission.module.js.map