import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { HierarchyNode } from './interfaces/hierarchy-node.interface';
import { SearchDownlineQueryDto } from './dto/search-downline-query.dto';
import { NetworkGrowthQueryDto, NetworkGrowthGroupBy } from './dto/network-growth-query.dto';
import {
  NetworkGrowthPoint,
  BranchCountNode,
  HierarchySummary,
} from './interfaces/network-analytics.interface';

@Injectable()
export class HierarchyService {
  private readonly ABSOLUTE_MAX_LEVELS_CAP = 20;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Fetches full downline referral tree for memberId up to maxLevels (parameterized, capped at 20 inside CTE SQL).
   * Uses high-performance PostgreSQL Recursive CTE via Prisma $queryRaw with SQL-level hard safety limits.
   */
  async getDownline(memberId: string, maxLevels: number = 10): Promise<HierarchyNode[]> {
    const member = await this.prisma.member.findUnique({
      where: { id: memberId },
      select: { id: true },
    });

    if (!member) {
      throw new NotFoundException(`Member with ID '${memberId}' not found`);
    }

    const cappedLevels = Math.min(Math.max(1, maxLevels || 10), this.ABSOLUTE_MAX_LEVELS_CAP);

    const downline = await this.prisma.$queryRaw<HierarchyNode[]>`
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
        WHERE d.level < LEAST(${cappedLevels}::int, 20)
      )
      SELECT * FROM downline ORDER BY level ASC, "joiningDate" DESC LIMIT 5000;
    `;

    return downline;
  }

  /**
   * Walks upline from memberId to the root sponsor up to maxLevels (parameterized, capped at 20 inside CTE SQL).
   * Uses high-performance PostgreSQL Recursive CTE via Prisma $queryRaw with SQL-level hard safety limits.
   */
  async getUpline(memberId: string, maxLevels: number = 20): Promise<HierarchyNode[]> {
    const member = await this.prisma.member.findUnique({
      where: { id: memberId },
      select: { id: true },
    });

    if (!member) {
      throw new NotFoundException(`Member with ID '${memberId}' not found`);
    }

    const cappedLevels = Math.min(Math.max(1, maxLevels || 20), this.ABSOLUTE_MAX_LEVELS_CAP);

    const upline = await this.prisma.$queryRaw<HierarchyNode[]>`
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
        WHERE u.level < LEAST(${cappedLevels}::int, 20)
      )
      SELECT * FROM upline ORDER BY level ASC LIMIT 20;
    `;

    return upline;
  }

  /**
   * Searches exclusively within a specific member's downline tree for matching name, memberCode, mobile, or email.
   */
  async searchDownline(
    memberId: string,
    queryDto: SearchDownlineQueryDto,
  ): Promise<HierarchyNode[]> {
    const member = await this.prisma.member.findUnique({
      where: { id: memberId },
      select: { id: true },
    });

    if (!member) {
      throw new NotFoundException(`Member with ID '${memberId}' not found`);
    }

    const maxLevels = queryDto.maxLevels || 20;
    const cappedLevels = Math.min(Math.max(1, maxLevels), this.ABSOLUTE_MAX_LEVELS_CAP);
    const searchTerm = `%${queryDto.q.trim()}%`;

    const results = await this.prisma.$queryRaw<HierarchyNode[]>`
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

  /**
   * Generates network growth analytics: counts new member registrations per level per week or month.
   */
  async getNetworkGrowth(
    memberId: string,
    queryDto: NetworkGrowthQueryDto,
  ): Promise<NetworkGrowthPoint[]> {
    const member = await this.prisma.member.findUnique({
      where: { id: memberId },
      select: { id: true },
    });

    if (!member) {
      throw new NotFoundException(`Member with ID '${memberId}' not found`);
    }

    const maxLevels = queryDto.maxLevels || 20;
    const cappedLevels = Math.min(Math.max(1, maxLevels), this.ABSOLUTE_MAX_LEVELS_CAP);
    const groupBy = queryDto.groupBy || NetworkGrowthGroupBy.MONTH;

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

    const map = new Map<string, NetworkGrowthPoint>();

    for (const node of filteredNodes) {
      const date = new Date(node.joiningDate);
      let period: string;

      if (groupBy === NetworkGrowthGroupBy.WEEK) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d.setDate(diff));
        period = monday.toISOString().split('T')[0];
      } else {
        period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      const key = `${period}_L${node.level}`;
      const existing = map.get(key);
      if (existing) {
        existing.joinCount++;
      } else {
        map.set(key, {
          period,
          level: node.level,
          joinCount: 1,
        });
      }
    }

    return Array.from(map.values()).sort((a, b) => {
      if (a.period !== b.period) return a.period.localeCompare(b.period);
      return a.level - b.level;
    });
  }

  /**
   * Computes branch counts (leg breakdown for each Level-1 direct referral).
   */
  async getBranchCounts(
    memberId: string,
    maxLevels: number = 20,
  ): Promise<BranchCountNode[]> {
    const member = await this.prisma.member.findUnique({
      where: { id: memberId },
      select: { id: true },
    });

    if (!member) {
      throw new NotFoundException(`Member with ID '${memberId}' not found`);
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

    const branchNodes: BranchCountNode[] = [];

    for (const leg of directReferrals) {
      const legDownline = await this.getDownline(leg.id, maxLevels - 1);
      const totalDownlineInBranch = legDownline.length + 1;
      const activeMembersInBranch =
        (leg.status === 'ACTIVE' ? 1 : 0) +
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

  /**
   * Computes total downline count metrics with status breakdown.
   */
  async getTotalDownlineCount(memberId: string, maxLevels: number = 20) {
    const downline = await this.getDownline(memberId, maxLevels);
    const total = downline.length;
    const active = downline.filter((n) => n.status === 'ACTIVE').length;
    const inactive = downline.filter((n) => n.status === 'INACTIVE').length;
    const blocked = downline.filter((n) => n.status === 'BLOCKED').length;
    const pending = downline.filter((n) => n.status === 'PENDING').length;

    return { total, active, inactive, blocked, pending };
  }

  /**
   * Combines downline metrics, branch-by-branch counts, and level distribution into a single summary response.
   */
  async getHierarchySummary(
    memberId: string,
    maxLevels: number = 20,
  ): Promise<HierarchySummary> {
    const member = await this.prisma.member.findUnique({
      where: { id: memberId },
      select: { id: true, memberCode: true, name: true },
    });

    if (!member) {
      throw new NotFoundException(`Member with ID '${memberId}' not found`);
    }

    const downline = await this.getDownline(memberId, maxLevels);
    const totalDownline = downline.length;
    const activeDownline = downline.filter((n) => n.status === 'ACTIVE').length;
    const inactiveDownline = downline.filter(
      (n) => n.status === 'INACTIVE' || n.status === 'BLOCKED',
    ).length;

    const branches = await this.getBranchCounts(memberId, maxLevels);

    const levelMap = new Map<number, { totalCount: number; activeCount: number }>();
    for (const node of downline) {
      const entry = levelMap.get(node.level) || { totalCount: 0, activeCount: 0 };
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

  /**
   * Helper method for access restriction checks (Section 8.3):
   * Verifies whether targetId belongs to memberId's downline tree by walking up targetId's upline CTE.
   * Returns true if targetId is memberId self or a downline member of memberId.
   * Returns false if targetId is an upline member or belongs to another branch.
   */
  async isInDownlineOf(memberId: string, targetId: string): Promise<boolean> {
    if (!memberId || !targetId) return false;
    if (memberId === targetId) return true;

    try {
      const upline = await this.getUpline(targetId, this.ABSOLUTE_MAX_LEVELS_CAP);
      return upline.some((node) => node.id === memberId);
    } catch {
      return false;
    }
  }

  /**
   * Alias for isInDownlineOf.
   */
  async isMemberInDownline(rootMemberId: string, targetMemberId: string): Promise<boolean> {
    return this.isInDownlineOf(rootMemberId, targetMemberId);
  }
}
