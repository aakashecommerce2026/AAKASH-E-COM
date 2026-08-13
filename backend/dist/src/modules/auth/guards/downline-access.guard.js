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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DownlineAccessGuard = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const hierarchy_service_1 = require("../../hierarchy/hierarchy.service");
let DownlineAccessGuard = class DownlineAccessGuard {
    hierarchyService;
    constructor(hierarchyService) {
        this.hierarchyService = hierarchyService;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user) {
            throw new common_1.UnauthorizedException('Authentication required');
        }
        if (user.role === client_1.MemberRole.ADMIN || user.role === client_1.MemberRole.SUB_ADMIN) {
            return true;
        }
        const params = request.params || {};
        const query = request.query || {};
        const body = request.body || {};
        const targetId = params.memberId ||
            params.id ||
            params.userId ||
            params.memberCode ||
            query.memberId ||
            body.memberId;
        if (!targetId) {
            return true;
        }
        if (targetId === user.id || targetId === user.memberCode) {
            return true;
        }
        const isDownline = await this.hierarchyService.isInDownlineOf(user.id, targetId);
        if (!isDownline) {
            throw new common_1.ForbiddenException('Access denied: You can only view or manage members within your own downline hierarchy');
        }
        return true;
    }
};
exports.DownlineAccessGuard = DownlineAccessGuard;
exports.DownlineAccessGuard = DownlineAccessGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [hierarchy_service_1.HierarchyService])
], DownlineAccessGuard);
//# sourceMappingURL=downline-access.guard.js.map