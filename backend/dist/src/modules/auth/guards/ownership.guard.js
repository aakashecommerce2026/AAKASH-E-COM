"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OwnershipGuard = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
let OwnershipGuard = class OwnershipGuard {
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user) {
            throw new common_1.UnauthorizedException('Authentication required');
        }
        if (user.role === client_1.MemberRole.ADMIN || user.role === client_1.MemberRole.SUB_ADMIN) {
            return true;
        }
        const params = request.params || {};
        const body = request.body || {};
        const targetId = params.id ||
            params.memberId ||
            params.userId ||
            params.memberCode ||
            body.memberId;
        if (!targetId) {
            return true;
        }
        const isOwner = targetId === user.id || targetId === user.memberCode;
        if (!isOwner) {
            throw new common_1.ForbiddenException('Access denied: You can only access or modify your own records');
        }
        return true;
    }
};
exports.OwnershipGuard = OwnershipGuard;
exports.OwnershipGuard = OwnershipGuard = __decorate([
    (0, common_1.Injectable)()
], OwnershipGuard);
//# sourceMappingURL=ownership.guard.js.map