import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { HierarchyNode } from './interfaces/hierarchy-node.interface';

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
}
