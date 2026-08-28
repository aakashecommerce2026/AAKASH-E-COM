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
exports.HierarchyController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const hierarchy_service_1 = require("./hierarchy.service");
const get_hierarchy_query_dto_1 = require("./dto/get-hierarchy-query.dto");
const search_downline_query_dto_1 = require("./dto/search-downline-query.dto");
const network_growth_query_dto_1 = require("./dto/network-growth-query.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
let HierarchyController = class HierarchyController {
    hierarchyService;
    constructor(hierarchyService) {
        this.hierarchyService = hierarchyService;
    }
    async getDownline(memberId, query) {
        const levels = query.maxLevels || 20;
        return this.hierarchyService.getDownline(memberId, levels, query.includeSelf || false);
    }
    async getDirectReferrals(memberId) {
        return this.hierarchyService.getDownline(memberId, 1);
    }
    async getUpline(memberId, query) {
        const levels = query.maxLevels || 20;
        return this.hierarchyService.getUpline(memberId, levels);
    }
    async searchDownline(memberId, query) {
        return this.hierarchyService.searchDownline(memberId, query);
    }
    async getNetworkGrowth(memberId, query) {
        return this.hierarchyService.getNetworkGrowth(memberId, query);
    }
    async getBranchCounts(memberId, query) {
        const levels = query.maxLevels || 20;
        return this.hierarchyService.getBranchCounts(memberId, levels);
    }
    async getHierarchySummary(memberId, query) {
        const levels = query.maxLevels || 20;
        return this.hierarchyService.getHierarchySummary(memberId, levels);
    }
};
exports.HierarchyController = HierarchyController;
__decorate([
    (0, common_1.Get)(':memberId/downline'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get level-tagged recursive downline tree for a member',
        description: 'Traverses the referral network downwards from target memberId up to parameterized depth (default 10, max 20 levels). Uses high-performance PostgreSQL Recursive CTE.',
    }),
    (0, swagger_1.ApiParam)({
        name: 'memberId',
        description: 'UUID of the root member to traverse downline from',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Level-tagged recursive downline tree nodes array',
        schema: {
            example: [
                {
                    id: 'b1c2d3e4-f5a6-7b8c-9d0e-1f2a3b4c5d6e',
                    memberCode: 'AK10002',
                    name: 'Jane Smith',
                    mobile: '+919876543210',
                    email: 'jane@example.com',
                    referrerId: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
                    joiningDate: '2026-08-01T10:00:00.000Z',
                    status: 'ACTIVE',
                    role: 'MEMBER',
                    level: 1,
                },
            ],
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Member not found' }),
    __param(0, (0, common_1.Param)('memberId')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, get_hierarchy_query_dto_1.GetHierarchyQueryDto]),
    __metadata("design:returntype", Promise)
], HierarchyController.prototype, "getDownline", null);
__decorate([
    (0, common_1.Get)(':memberId/direct-referrals'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get Level-1 direct referrals only for specified member ID',
        description: 'Fetches direct referrals (Level 1 only) sponsored by target memberId.',
    }),
    (0, swagger_1.ApiParam)({ name: 'memberId', description: 'UUID of the target member' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Level-1 direct referrals list',
        schema: {
            example: [
                {
                    id: 'b1c2d3e4-f5a6-7b8c-9d0e-1f2a3b4c5d6e',
                    memberCode: 'AK10002',
                    name: 'Jane Smith',
                    mobile: '+919876543210',
                    email: 'jane@example.com',
                    referrerId: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
                    joiningDate: '2026-08-01T10:00:00.000Z',
                    status: 'ACTIVE',
                    role: 'MEMBER',
                    level: 1,
                },
            ],
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Member not found' }),
    __param(0, (0, common_1.Param)('memberId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], HierarchyController.prototype, "getDirectReferrals", null);
__decorate([
    (0, common_1.Get)(':memberId/upline'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get recursive upline chain from target member up to root sponsor',
        description: 'Walks upwards from target memberId through direct sponsors to the root sponsor. Used for internal debugging and lineage checks.',
    }),
    (0, swagger_1.ApiParam)({
        name: 'memberId',
        description: 'UUID of the target member to walk upline from',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Level-tagged upline referral chain array',
        schema: {
            example: [
                {
                    id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
                    memberCode: 'AK10001',
                    name: 'Direct Sponsor',
                    mobile: '+919876543200',
                    email: 'sponsor@example.com',
                    referrerId: '00000000-0000-0000-0000-000000000000',
                    joiningDate: '2026-01-01T00:00:00.000Z',
                    status: 'ACTIVE',
                    role: 'ADMIN',
                    level: 1,
                },
            ],
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Member not found' }),
    __param(0, (0, common_1.Param)('memberId')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, get_hierarchy_query_dto_1.GetHierarchyQueryDto]),
    __metadata("design:returntype", Promise)
], HierarchyController.prototype, "getUpline", null);
__decorate([
    (0, common_1.Get)(':memberId/search'),
    (0, swagger_1.ApiOperation)({
        summary: "Search exclusively within a specific member's downline hierarchy",
        description: 'Filters downline nodes under target memberId by matching query parameter q against name, memberCode, mobile, or email.',
    }),
    (0, swagger_1.ApiParam)({
        name: 'memberId',
        description: 'UUID of the root member whose downline is searched',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Matching downline hierarchy nodes array',
        schema: {
            example: [
                {
                    id: 'b1c2d3e4-f5a6-7b8c-9d0e-1f2a3b4c5d6e',
                    memberCode: 'AK10005',
                    name: 'John Doe',
                    mobile: '+919999999999',
                    email: 'john@example.com',
                    referrerId: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
                    joiningDate: '2026-08-05T12:30:00.000Z',
                    status: 'ACTIVE',
                    role: 'MEMBER',
                    level: 2,
                },
            ],
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Missing search query parameter q' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Member not found' }),
    __param(0, (0, common_1.Param)('memberId')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, search_downline_query_dto_1.SearchDownlineQueryDto]),
    __metadata("design:returntype", Promise)
], HierarchyController.prototype, "searchDownline", null);
__decorate([
    (0, common_1.Get)(':memberId/growth'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get network growth breakdown (new joins per level per week or month)',
        description: 'Aggregates new member registrations per level per time bucket (week or month) for Admin Analyze Network Growth requirement.',
    }),
    (0, swagger_1.ApiParam)({ name: 'memberId', description: 'UUID of the target member' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Network growth analytics breakdown points array',
        schema: {
            example: [
                {
                    period: '2026-08',
                    level: 1,
                    joinCount: 15,
                },
                {
                    period: '2026-08',
                    level: 2,
                    joinCount: 42,
                },
            ],
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Member not found' }),
    __param(0, (0, common_1.Param)('memberId')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, network_growth_query_dto_1.NetworkGrowthQueryDto]),
    __metadata("design:returntype", Promise)
], HierarchyController.prototype, "getNetworkGrowth", null);
__decorate([
    (0, common_1.Get)(':memberId/branch-counts'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get branch count breakdown for each Level-1 leg under target member',
        description: 'Computes total downline and active member counts for each direct Level-1 referral leg under target memberId.',
    }),
    (0, swagger_1.ApiParam)({ name: 'memberId', description: 'UUID of the target member' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Branch leg breakdown array with total and active downline counts',
        schema: {
            example: [
                {
                    branchRootId: 'b1c2d3e4-f5a6-7b8c-9d0e-1f2a3b4c5d6e',
                    branchRootCode: 'AK10002',
                    branchRootName: 'Leg 1 Sponsor',
                    status: 'ACTIVE',
                    totalDownlineInBranch: 25,
                    activeMembersInBranch: 22,
                },
            ],
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Member not found' }),
    __param(0, (0, common_1.Param)('memberId')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, get_hierarchy_query_dto_1.GetHierarchyQueryDto]),
    __metadata("design:returntype", Promise)
], HierarchyController.prototype, "getBranchCounts", null);
__decorate([
    (0, common_1.Get)(':memberId/summary'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get comprehensive hierarchy summary dashboard statistics',
        description: 'Returns total downline metrics, active vs inactive counts, total branches, leg breakdown, and level distribution in a single summary response.',
    }),
    (0, swagger_1.ApiParam)({ name: 'memberId', description: 'UUID of the target member' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Comprehensive network dashboard summary object',
        schema: {
            example: {
                memberId: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
                memberCode: 'AK10001',
                memberName: 'Root Sponsor',
                totalDownline: 120,
                activeDownline: 110,
                inactiveDownline: 10,
                totalBranches: 4,
                branches: [
                    {
                        branchRootId: 'b1c2d3e4-f5a6-7b8c-9d0e-1f2a3b4c5d6e',
                        branchRootCode: 'AK10002',
                        branchRootName: 'Leg 1',
                        status: 'ACTIVE',
                        totalDownlineInBranch: 45,
                        activeMembersInBranch: 42,
                    },
                ],
                levelBreakdown: [
                    { level: 1, totalCount: 4, activeCount: 4 },
                    { level: 2, totalCount: 16, activeCount: 15 },
                ],
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Member not found' }),
    __param(0, (0, common_1.Param)('memberId')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, get_hierarchy_query_dto_1.GetHierarchyQueryDto]),
    __metadata("design:returntype", Promise)
], HierarchyController.prototype, "getHierarchySummary", null);
exports.HierarchyController = HierarchyController = __decorate([
    (0, swagger_1.ApiTags)('Admin Hierarchy Traversal & Network Analytics'),
    (0, common_1.Controller)('admin/hierarchy'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.MemberRole.ADMIN, client_1.MemberRole.SUB_ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [hierarchy_service_1.HierarchyService])
], HierarchyController);
//# sourceMappingURL=hierarchy.controller.js.map