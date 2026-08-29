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
exports.HierarchyService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const network_growth_query_dto_1 = require("./dto/network-growth-query.dto");
let HierarchyService = class HierarchyService {
    prisma;
    ABSOLUTE_MAX_LEVELS_CAP = 20;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getDownline(memberId, maxLevels = 10, includeSelf = false) {
        const member = await this.prisma.member.findUnique({
            where: { id: memberId },
            select: { id: true },
        });
        if (!member) {
            throw new common_1.NotFoundException(`Member with ID '${memberId}' not found`);
        }
        const cappedLevels = Math.min(Math.max(1, maxLevels || 10), this.ABSOLUTE_MAX_LEVELS_CAP);
        if (includeSelf) {
            const downline = await this.prisma.$queryRaw `
        WITH RECURSIVE downline AS (
          SELECT 
            m.id,
            m.member_code AS "memberCode",
            m.username,
            m.name,
            m.mobile,
            m.email,
            m.profile_photo AS "profilePhoto",
            m.referrer_id AS "referrerId",
            m.joining_date AS "joiningDate",
            m.status::text AS status,
            m.role::text AS role,
            0 AS level
          FROM members m
          WHERE m.id = ${memberId}

          UNION ALL

          SELECT 
            m.id,
            m.member_code AS "memberCode",
            m.username,
            m.name,
            m.mobile,
            m.email,
            m.profile_photo AS "profilePhoto",
            m.referrer_id AS "referrerId",
            m.joining_date AS "joiningDate",
            m.status::text AS status,
            m.role::text AS role,
            d.level + 1 AS level
          FROM members m
          INNER JOIN downline d ON m.referrer_id = d.id
          WHERE d.level < LEAST(${cappedLevels}::int, 20)
        )
        SELECT * FROM downline ORDER BY level ASC, "joiningDate" DESC LIMIT 5000;
      `;
            return downline;
        }
        const downline = await this.prisma.$queryRaw `
      WITH RECURSIVE downline AS (
        SELECT 
          m.id,
          m.member_code AS "memberCode",
          m.username,
          m.name,
          m.mobile,
          m.email,
          m.profile_photo AS "profilePhoto",
          m.referrer_id AS "referrerId",
          m.joining_date AS "joiningDate",
          m.status::text AS status,
          m.role::text AS role,
          1 AS level
        FROM members m
        WHERE m.referrer_id = ${memberId}

        UNION ALL

        SELECT 
          m.id,
          m.member_code AS "memberCode",
          m.username,
          m.name,
          m.mobile,
          m.email,
          m.profile_photo AS "profilePhoto",
          m.referrer_id AS "referrerId",
          m.joining_date AS "joiningDate",
          m.status::text AS status,
          m.role::text AS role,
          d.level + 1 AS level
        FROM members m
        INNER JOIN downline d ON m.referrer_id = d.id
        WHERE d.level < LEAST(${cappedLevels}::int, 20)
      )
      SELECT * FROM downline ORDER BY level ASC, "joiningDate" DESC LIMIT 5000;
    `;
        return downline;
    }
    async getUpline(memberId, maxLevels = 20) {
        const member = await this.prisma.member.findUnique({
            where: { id: memberId },
            select: { id: true },
        });
        if (!member) {
            throw new common_1.NotFoundException(`Member with ID '${memberId}' not found`);
        }
        const cappedLevels = Math.min(Math.max(1, maxLevels || 20), this.ABSOLUTE_MAX_LEVELS_CAP);
        const upline = await this.prisma.$queryRaw `
      WITH RECURSIVE upline AS (
        SELECT 
          m.id,
          m.member_code AS "memberCode",
          m.username,
          m.name,
          m.mobile,
          m.email,
          m.profile_photo AS "profilePhoto",
          m.referrer_id AS "referrerId",
          m.joining_date AS "joiningDate",
          m.status::text AS status,
          m.role::text AS role,
          1 AS level
        FROM members target_m
        INNER JOIN members m ON target_m.referrer_id = m.id
        WHERE target_m.id = ${memberId}

        UNION ALL

        SELECT 
          m.id,
          m.member_code AS "memberCode",
          m.username,
          m.name,
          m.mobile,
          m.email,
          m.profile_photo AS "profilePhoto",
          m.referrer_id AS "referrerId",
          m.joining_date AS "joiningDate",
          m.status::text AS status,
          m.role::text AS role,
          u.level + 1 AS level
        FROM members m
        INNER JOIN upline u ON m.id = u."referrerId"
        WHERE u.level < LEAST(${cappedLevels}::int, 20)
      )
      SELECT * FROM upline ORDER BY level ASC LIMIT 20;
    `;
        return upline;
    }
    async searchDownline(memberId, queryDto) {
        const member = await this.prisma.member.findUnique({
            where: { id: memberId },
            select: { id: true },
        });
        if (!member) {
            throw new common_1.NotFoundException(`Member with ID '${memberId}' not found`);
        }
        const maxLevels = queryDto.maxLevels || 20;
        const cappedLevels = Math.min(Math.max(1, maxLevels), this.ABSOLUTE_MAX_LEVELS_CAP);
        const searchTerm = queryDto.q && queryDto.q.trim() ? `%${queryDto.q.trim()}%` : '%';
        const results = await this.prisma.$queryRaw `
      WITH RECURSIVE downline AS (
        SELECT 
          m.id,
          m.member_code AS "memberCode",
          m.username,
          m.name,
          m.mobile,
          m.email,
          m.profile_photo AS "profilePhoto",
          m.referrer_id AS "referrerId",
          m.joining_date AS "joiningDate",
          m.status::text AS status,
          m.role::text AS role,
          1 AS level
        FROM members m
        WHERE m.referrer_id = ${memberId}

        UNION ALL

        SELECT 
          m.id,
          m.member_code AS "memberCode",
          m.username,
          m.name,
          m.mobile,
          m.email,
          m.profile_photo AS "profilePhoto",
          m.referrer_id AS "referrerId",
          m.joining_date AS "joiningDate",
          m.status::text AS status,
          m.role::text AS role,
          d.level + 1 AS level
        FROM members m
        INNER JOIN downline d ON m.referrer_id = d.id
        WHERE d.level < LEAST(${cappedLevels}::int, 20)
      )
      SELECT * FROM downline 
      WHERE LOWER(name) LIKE LOWER(${searchTerm})
         OR LOWER("memberCode") LIKE LOWER(${searchTerm})
         OR mobile LIKE ${searchTerm}
         OR (email IS NOT NULL AND LOWER(email) LIKE LOWER(${searchTerm}))
      ORDER BY level ASC, "joiningDate" DESC 
      LIMIT 1000;
    `;
        return results;
    }
    async getNetworkGrowth(memberId, queryDto) {
        const member = await this.prisma.member.findUnique({
            where: { id: memberId },
            select: { id: true },
        });
        if (!member) {
            throw new common_1.NotFoundException(`Member with ID '${memberId}' not found`);
        }
        const maxLevels = queryDto.maxLevels || 20;
        const cappedLevels = Math.min(Math.max(1, maxLevels), this.ABSOLUTE_MAX_LEVELS_CAP);
        const groupBy = queryDto.groupBy || network_growth_query_dto_1.NetworkGrowthGroupBy.MONTH;
        const downlineNodes = await this.getDownline(memberId, cappedLevels);
        let filteredNodes = downlineNodes;
        if (queryDto.startDate) {
            const start = new Date(queryDto.startDate);
            filteredNodes = filteredNodes.filter((n) => new Date(n.joiningDate) >= start);
        }
        if (queryDto.endDate) {
            const end = new Date(queryDto.endDate);
            filteredNodes = filteredNodes.filter((n) => new Date(n.joiningDate) <= end);
        }
        const map = new Map();
        for (const node of filteredNodes) {
            const date = new Date(node.joiningDate);
            let period;
            if (groupBy === network_growth_query_dto_1.NetworkGrowthGroupBy.WEEK) {
                const d = new Date(date);
                const day = d.getDay();
                const diff = d.getDate() - day + (day === 0 ? -6 : 1);
                const monday = new Date(d.setDate(diff));
                period = monday.toISOString().split('T')[0];
            }
            else {
                period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            }
            const key = `${period}_L${node.level}`;
            const existing = map.get(key);
            if (existing) {
                existing.joinCount++;
            }
            else {
                map.set(key, {
                    period,
                    level: node.level,
                    joinCount: 1,
                });
            }
        }
        return Array.from(map.values()).sort((a, b) => {
            if (a.period !== b.period)
                return a.period.localeCompare(b.period);
            return a.level - b.level;
        });
    }
    async getBranchCounts(memberId, maxLevels = 20) {
        const member = await this.prisma.member.findUnique({
            where: { id: memberId },
            select: { id: true },
        });
        if (!member) {
            throw new common_1.NotFoundException(`Member with ID '${memberId}' not found`);
        }
        const directReferrals = await this.prisma.member.findMany({
            where: { referrerId: memberId },
            select: {
                id: true,
                memberCode: true,
                name: true,
                status: true,
            },
        });
        const branchNodes = [];
        for (const leg of directReferrals) {
            const legDownline = await this.getDownline(leg.id, maxLevels - 1);
            const totalDownlineInBranch = legDownline.length + 1;
            const activeMembersInBranch = (leg.status === 'ACTIVE' ? 1 : 0) +
                legDownline.filter((n) => n.status === 'ACTIVE').length;
            branchNodes.push({
                branchRootId: leg.id,
                branchRootCode: leg.memberCode,
                branchRootName: leg.name,
                status: leg.status,
                totalDownlineInBranch,
                activeMembersInBranch,
            });
        }
        return branchNodes;
    }
    async getTotalDownlineCount(memberId, maxLevels = 20) {
        const downline = await this.getDownline(memberId, maxLevels);
        const total = downline.length;
        const active = downline.filter((n) => n.status === 'ACTIVE').length;
        const inactive = downline.filter((n) => n.status === 'INACTIVE').length;
        const blocked = downline.filter((n) => n.status === 'BLOCKED').length;
        const pending = downline.filter((n) => n.status === 'PENDING').length;
        return { total, active, inactive, blocked, pending };
    }
    async getHierarchySummary(memberId, maxLevels = 20) {
        const member = await this.prisma.member.findUnique({
            where: { id: memberId },
            select: { id: true, memberCode: true, name: true },
        });
        if (!member) {
            throw new common_1.NotFoundException(`Member with ID '${memberId}' not found`);
        }
        const downline = await this.getDownline(memberId, maxLevels);
        const totalDownline = downline.length;
        const activeDownline = downline.filter((n) => n.status === 'ACTIVE').length;
        const inactiveDownline = downline.filter((n) => n.status === 'INACTIVE' || n.status === 'BLOCKED').length;
        const branches = await this.getBranchCounts(memberId, maxLevels);
        const levelMap = new Map();
        for (const node of downline) {
            const entry = levelMap.get(node.level) || {
                totalCount: 0,
                activeCount: 0,
            };
            entry.totalCount++;
            if (node.status === 'ACTIVE') {
                entry.activeCount++;
            }
            levelMap.set(node.level, entry);
        }
        const levelBreakdown = Array.from(levelMap.entries())
            .map(([level, counts]) => ({
            level,
            totalCount: counts.totalCount,
            activeCount: counts.activeCount,
        }))
            .sort((a, b) => a.level - b.level);
        return {
            memberId: member.id,
            memberCode: member.memberCode,
            memberName: member.name,
            totalDownline,
            activeDownline,
            inactiveDownline,
            totalBranches: branches.length,
            branches,
            levelBreakdown,
        };
    }
    async isInDownlineOf(memberId, targetId) {
        if (!memberId || !targetId)
            return false;
        if (memberId === targetId)
            return true;
        try {
            const upline = await this.getUpline(targetId, this.ABSOLUTE_MAX_LEVELS_CAP);
            return upline.some((node) => node.id === memberId);
        }
        catch {
            return false;
        }
    }
    async isMemberInDownline(rootMemberId, targetMemberId) {
        return this.isInDownlineOf(rootMemberId, targetMemberId);
    }
};
exports.HierarchyService = HierarchyService;
exports.HierarchyService = HierarchyService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], HierarchyService);
//# sourceMappingURL=hierarchy.service.js.map