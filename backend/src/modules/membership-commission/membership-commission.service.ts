import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CommissionStatus, MemberStatus, Prisma } from '@prisma/client';
import {
  CreateCommissionConfigDto,
  MembershipCommissionConfigResponseDto,
} from './dto/membership-commission-config.dto';
import { QueryMembershipCommissionDto } from './dto/query-membership-commission.dto';
import { MembershipCommissionResponseDto } from './dto/membership-commission-response.dto';

export const DEFAULT_20_LEVEL_RATES: {
  level: number;
  percentage: number;
  description: string;
}[] = [
  { level: 1, percentage: 10.0, description: 'Level 1 Sponsor Commission' },
  {
    level: 2,
    percentage: 5.0,
    description: 'Level 2 Direct Upline Commission',
  },
  { level: 3, percentage: 2.5, description: 'Level 3 Upline Commission' },
  { level: 4, percentage: 1.5, description: 'Level 4 Upline Commission' },
  { level: 5, percentage: 1.0, description: 'Level 5 Upline Commission' },
  { level: 6, percentage: 0.75, description: 'Level 6 Upline Commission' },
  ...Array.from({ length: 14 }, (_, i) => ({
    level: i + 7,
    percentage: 0.5,
    description: `Level ${i + 7} Upline Commission`,
  })),
];

@Injectable()
export class MembershipCommissionService {
  private readonly logger = new Logger(MembershipCommissionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Retrieves active or specified version of the 20-level membership commission rates schedule.
   */
  async getActiveConfig(
    version?: number,
    txClient?: Prisma.TransactionClient,
  ): Promise<MembershipCommissionConfigResponseDto[]> {
    const db: any = txClient || this.prisma;
    let targetVersion = version;

    if (!targetVersion) {
      const latestActive = await db.membershipCommissionConfig.findFirst({
        where: { isActive: true },
        orderBy: { version: 'desc' },
        select: { version: true },
      });

      if (latestActive) {
        targetVersion = latestActive.version;
      }
    }

    if (targetVersion) {
      const configs = await db.membershipCommissionConfig.findMany({
        where: { version: targetVersion },
        orderBy: { level: 'asc' },
      });

      if (configs.length > 0) {
        return configs.map((c: any) => ({
          ...c,
          percentage: Number(c.percentage),
        }));
      }
    }

    // Fallback if database table has no version records yet
    return DEFAULT_20_LEVEL_RATES.map((r) => ({
      id: `default-v1-lvl-${r.level}`,
      version: 1,
      level: r.level,
      percentage: r.percentage,
      isActive: true,
      description: r.description,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  }

  /**
   * Creates or updates a versioned 20-level commission rate configuration.
   */
  async publishConfigVersion(
    dto: CreateCommissionConfigDto,
    actorId?: string,
  ): Promise<MembershipCommissionConfigResponseDto[]> {
    const { version, rates, isActive = true } = dto;

    if (!rates || rates.length === 0) {
      throw new BadRequestException(
        'Commission rate schedule must contain at least one level',
      );
    }

    const levelSet = new Set<number>();
    for (const r of rates) {
      if (r.level < 1 || r.level > 20) {
        throw new BadRequestException(
          `Invalid level ${r.level}. Levels must be between 1 and 20.`,
        );
      }
      if (levelSet.has(r.level)) {
        throw new BadRequestException(
          `Duplicate level entry found for level ${r.level}`,
        );
      }
      levelSet.add(r.level);
    }

    return this.prisma.$transaction(async (tx: any) => {
      if (isActive) {
        // Deactivate existing versions
        await tx.membershipCommissionConfig.updateMany({
          where: { isActive: true },
          data: { isActive: false },
        });
      }

      // Upsert rates for the specified version
      const createdConfigs = [];
      for (const r of rates) {
        const config = await tx.membershipCommissionConfig.upsert({
          where: {
            version_level: {
              version,
              level: r.level,
            },
          },
          update: {
            percentage: new Prisma.Decimal(r.percentage),
            isActive,
            description: r.description,
          },
          create: {
            version,
            level: r.level,
            percentage: new Prisma.Decimal(r.percentage),
            isActive,
            description: r.description,
          },
        });
        createdConfigs.push(config);
      }

      await this.auditService.logAction({
        actorId: actorId || null,
        actionType: 'PUBLISH_COMMISSION_CONFIG',
        entityType: 'MembershipCommissionConfig',
        entityId: `version-${version}`,
        metadata: {
          version,
          isActive,
          rateCount: rates.length,
        },
      });

      return createdConfigs.map((c) => ({
        ...c,
        percentage: Number(c.percentage),
      }));
    });
  }

  /**
   * Calculates 20-level membership registration commission for a new member.
   * Walks the upline via PostgreSQL Recursive CTE up to 20 levels.
   * Writes one row per beneficiary into membership_commission_ledger with status = PENDING.
   * If upline has fewer than 20 levels, stops cleanly with no phantom rows or errors.
   */
  async calculateForNewMember(
    memberId: string,
    joiningFee: number = 10000,
    txClient?: Prisma.TransactionClient,
  ): Promise<MembershipCommissionResponseDto[]> {
    const db: any = txClient || this.prisma;

    // 1. Idempotency check: Ensure commissions have not already been computed for this source member
    const existingCount = await db.membershipCommissionLedger.count({
      where: { sourceMemberId: memberId },
    });

    if (existingCount > 0) {
      this.logger.log(
        `Commissions already calculated for member '${memberId}'. Skipping duplicate engine execution.`,
      );
      const existingLedgers = await db.membershipCommissionLedger.findMany({
        where: { sourceMemberId: memberId },
        orderBy: { level: 'asc' },
      });
      return existingLedgers.map((l: any) => this.mapLedgerToDto(l));
    }

    // 2. Fetch source member to verify existence and check referrer
    const sourceMember = await db.member.findUnique({
      where: { id: memberId },
      select: { id: true, referrerId: true, memberCode: true, status: true },
    });

    if (!sourceMember) {
      throw new NotFoundException(`Member with ID '${memberId}' not found`);
    }

    if (!sourceMember.referrerId) {
      this.logger.log(
        `Member '${sourceMember.memberCode}' (${memberId}) has no referrer (Root/Direct). No upline commissions generated.`,
      );
      return [];
    }

    // 3. Fetch active 20-level percentage schedule
    const activeConfigs = await this.getActiveConfig(undefined, txClient);
    const rateMap = new Map<number, number>();
    activeConfigs.forEach((c) => {
      rateMap.set(c.level, Number(c.percentage));
    });

    // 4. Walk the upline up to 20 levels via Recursive CTE (with fallback for unit-test/mock environments)
    let uplineNodes: {
      id: string;
      memberCode?: string;
      referrerId?: string | null;
      status?: string;
      isCommissionFrozen?: boolean;
      level: number;
    }[] = [];

    try {
      if (typeof db.$queryRaw === 'function') {
        const rawNodes = await db.$queryRaw(Prisma.sql`
          WITH RECURSIVE upline AS (
            SELECT 
              m.id,
              m.member_code AS "memberCode",
              m.referrer_id AS "referrerId",
              m.status AS status,
              m.is_commission_frozen AS "isCommissionFrozen",
              1 AS level
            FROM members target_m
            INNER JOIN members m ON target_m.referrer_id = m.id
            WHERE target_m.id = ${memberId}

            UNION ALL

            SELECT 
              m.id,
              m.member_code AS "memberCode",
              m.referrer_id AS "referrerId",
              m.status AS status,
              m.is_commission_frozen AS "isCommissionFrozen",
              u.level + 1 AS level
            FROM members m
            INNER JOIN upline u ON m.id = u."referrerId"
            WHERE u.level < 20
          )
          SELECT id, "memberCode", "referrerId", status, "isCommissionFrozen", level FROM upline ORDER BY level ASC LIMIT 20;
        `);
        if (Array.isArray(rawNodes) && rawNodes.length > 0) {
          uplineNodes = rawNodes.map((node: any) => ({
            id: node.id,
            memberCode: node.memberCode,
            referrerId: node.referrerId,
            status: node.status,
            isCommissionFrozen: node.isCommissionFrozen,
            level: Number(node.level),
          }));
        }
      }
    } catch {
      uplineNodes = [];
    }

    // Fallback if CTE did not return nodes or running in mock environment
    if (uplineNodes.length === 0) {
      let currentRefId: string | null = sourceMember.referrerId;
      let lvl = 1;
      const visited = new Set<string>([memberId]);

      while (currentRefId && lvl <= 20) {
        if (visited.has(currentRefId)) {
          this.logger.warn(
            `Cycle detected in referral chain for member '${memberId}' at level ${lvl}. Aborting.`,
          );
          break;
        }
        visited.add(currentRefId);

        const parent = await db.member.findUnique({
          where: { id: currentRefId },
          select: {
            id: true,
            referrerId: true,
            memberCode: true,
            status: true,
            isCommissionFrozen: true,
          },
        });

        if (!parent) break;

        uplineNodes.push({
          id: parent.id,
          memberCode: parent.memberCode,
          referrerId: parent.referrerId,
          status: parent.status,
          isCommissionFrozen: (parent as any).isCommissionFrozen,
          level: lvl,
        });

        currentRefId = parent.referrerId;
        lvl++;
      }
    }

    // 5. Compute amount = joiningFee * percentage for each level present and write ledger row
    // Active members receive PENDING status; inactive/suspended/frozen members receive HOLD status (flagged money-in-transit)
    const generatedLedgers: any[] = [];

    for (const node of uplineNodes) {
      if (node.level > 20) break;

      const ratePercentage = rateMap.get(node.level) ?? 0;

      if (ratePercentage > 0) {
        const commissionAmount = (joiningFee * ratePercentage) / 100;

        const ledgerStatus =
          !node.status ||
          (node.status === MemberStatus.ACTIVE &&
            !(node as any).isCommissionFrozen)
            ? CommissionStatus.PENDING
            : CommissionStatus.HOLD;

        const ledger = await db.membershipCommissionLedger.create({
          data: {
            sourceMemberId: memberId,
            beneficiaryMemberId: node.id,
            level: node.level,
            percentage: new Prisma.Decimal(ratePercentage),
            amount: new Prisma.Decimal(commissionAmount),
            status: ledgerStatus,
          },
        });

        generatedLedgers.push(ledger);
      }
    }

    this.logger.log(
      `Successfully generated ${generatedLedgers.length} commission ledger entries for newly registered member '${sourceMember.memberCode}' (${memberId}).`,
    );

    return generatedLedgers.map((l: any) => this.mapLedgerToDto(l));
  }

  /**
   * Trigger-on-registration commission calculation engine (delegates to calculateForNewMember).
   */
  async processRegistrationCommissions(
    sourceMemberId: string,
    packageAmount: number = 1000,
    txClient?: Prisma.TransactionClient,
  ): Promise<MembershipCommissionResponseDto[]> {
    return this.calculateForNewMember(sourceMemberId, packageAmount, txClient);
  }

  /**
   * Retrieves commission ledger entries with filtering and pagination.
   */
  async findAll(query: QueryMembershipCommissionDto) {
    const {
      page = 1,
      limit = 10,
      sourceMemberId,
      beneficiaryMemberId,
      level,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;
    const where: Prisma.MembershipCommissionLedgerWhereInput = {};

    if (sourceMemberId) {
      where.sourceMemberId = sourceMemberId;
    }
    if (beneficiaryMemberId) {
      where.beneficiaryMemberId = beneficiaryMemberId;
    }
    if (level) {
      where.level = level;
    }
    if (status) {
      where.status = status;
    }

    const validSortFields = ['createdAt', 'amount', 'level', 'status'];
    const orderByField = validSortFields.includes(sortBy)
      ? sortBy
      : 'createdAt';

    const [total, ledgers] = await Promise.all([
      this.prisma.membershipCommissionLedger.count({ where }),
      this.prisma.membershipCommissionLedger.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [orderByField]: sortOrder },
        include: {
          sourceMember: {
            select: { id: true, memberCode: true, name: true, mobile: true },
          },
          beneficiaryMember: {
            select: { id: true, memberCode: true, name: true, mobile: true },
          },
        },
      }),
    ]);

    const data = ledgers.map((l) => ({
      ...this.mapLedgerToDto(l),
      sourceMember: l.sourceMember,
      beneficiaryMember: l.beneficiaryMember,
    }));

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Retrieves a single membership commission ledger by ID.
   */
  async findById(id: string): Promise<MembershipCommissionResponseDto> {
    const ledger = await this.prisma.membershipCommissionLedger.findUnique({
      where: { id },
      include: {
        sourceMember: {
          select: { id: true, memberCode: true, name: true },
        },
        beneficiaryMember: {
          select: { id: true, memberCode: true, name: true },
        },
      },
    });

    if (!ledger) {
      throw new NotFoundException(
        `Membership commission ledger with ID '${id}' not found`,
      );
    }

    return {
      ...this.mapLedgerToDto(ledger),
      sourceMember: ledger.sourceMember,
      beneficiaryMember: ledger.beneficiaryMember,
    } as any;
  }

  private mapLedgerToDto(ledger: any): MembershipCommissionResponseDto {
    return {
      id: ledger.id,
      sourceMemberId: ledger.sourceMemberId,
      beneficiaryMemberId: ledger.beneficiaryMemberId,
      level: ledger.level,
      percentage: Number(ledger.percentage),
      amount: Number(ledger.amount),
      status: ledger.status,
      createdAt: ledger.createdAt,
      updatedAt: ledger.updatedAt,
    };
  }
}
