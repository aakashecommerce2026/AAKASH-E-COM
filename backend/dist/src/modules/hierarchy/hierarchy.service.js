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
let HierarchyService = class HierarchyService {
    prisma;
    MAX_LEVELS_CAP = 20;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getDownline(memberId, maxLevels = 10) {
        const member = await this.prisma.member.findUnique({
            where: { id: memberId },
            select: { id: true },
        });
        if (!member) {
            throw new common_1.NotFoundException(`Member with ID '${memberId}' not found`);
        }
        const cappedLevels = Math.min(Math.max(1, maxLevels || 10), this.MAX_LEVELS_CAP);
        const downline = await this.prisma.$queryRaw `
      WITH RECURSIVE downline AS (
        SELECT 
          m.id,
          m.member_code AS "memberCode",
          m.name,
          m.mobile,
          m.email,
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
          m.name,
          m.mobile,
          m.email,
          m.referrer_id AS "referrerId",
          m.joining_date AS "joiningDate",
          m.status::text AS status,
          m.role::text AS role,
          d.level + 1 AS level
        FROM members m
        INNER JOIN downline d ON m.referrer_id = d.id
        WHERE d.level < ${cappedLevels}
      )
      SELECT * FROM downline ORDER BY level ASC, "joiningDate" DESC;
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
        const cappedLevels = Math.min(Math.max(1, maxLevels || 20), this.MAX_LEVELS_CAP);
        const upline = await this.prisma.$queryRaw `
      WITH RECURSIVE upline AS (
        SELECT 
          m.id,
          m.member_code AS "memberCode",
          m.name,
          m.mobile,
          m.email,
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
          m.name,
          m.mobile,
          m.email,
          m.referrer_id AS "referrerId",
          m.joining_date AS "joiningDate",
          m.status::text AS status,
          m.role::text AS role,
          u.level + 1 AS level
        FROM members m
        INNER JOIN upline u ON m.id = u."referrerId"
        WHERE u.level < ${cappedLevels}
      )
      SELECT * FROM upline ORDER BY level ASC;
    `;
        return upline;
    }
};
exports.HierarchyService = HierarchyService;
exports.HierarchyService = HierarchyService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], HierarchyService);
//# sourceMappingURL=hierarchy.service.js.map