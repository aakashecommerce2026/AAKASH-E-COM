"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MembersModule = void 0;
const common_1 = require("@nestjs/common");
const members_service_1 = require("./members.service");
const member_profile_service_1 = require("./member-profile.service");
const members_controller_1 = require("./members.controller");
const admin_members_controller_1 = require("./admin-members.controller");
const member_profile_controller_1 = require("./member-profile.controller");
const prisma_module_1 = require("../../prisma/prisma.module");
const audit_module_1 = require("../audit/audit.module");
const membership_commission_module_1 = require("../membership-commission/membership-commission.module");
const email_module_1 = require("../email/email.module");
const promotions_module_1 = require("../promotions/promotions.module");
let MembersModule = class MembersModule {
};
exports.MembersModule = MembersModule;
exports.MembersModule = MembersModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, audit_module_1.AuditModule, membership_commission_module_1.MembershipCommissionModule, email_module_1.EmailModule, promotions_module_1.PromotionsModule],
        controllers: [members_controller_1.MembersController, admin_members_controller_1.AdminMembersController, member_profile_controller_1.MemberProfileController],
        providers: [members_service_1.MembersService, member_profile_service_1.MemberProfileService],
        exports: [members_service_1.MembersService, member_profile_service_1.MemberProfileService],
    })
], MembersModule);
//# sourceMappingURL=members.module.js.map