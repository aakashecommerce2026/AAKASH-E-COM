import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CommissionStatus, Prisma } from '@prisma/client';
import {
  CreateCommissionConfigDto,
  MembershipCommissionConfigResponseDto,
} from './dto/membership-commission-config.dto';
import { QueryMembershipCommissionDto } from './dto/query-membership-commission.dto';
import { MembershipCommissionResponseDto } from './dto/membership-commission-response.dto';

export const DEFAULT_20_LEVEL_RATES: { level: number; percentage: number; description: string }[] = [
  { level: 1, percentage: 10.0, description: 'Level 1 Sponsor Commission' },
  { level: 2, percentage: 5.0, description: 'Level 2 Direct Upline Commission' },
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
  async getActiveConfig(version?: number): Promise<MembershipCommissionConfigResponseDto[]> {
    let targetVersion = version;

    if (!targetVersion) {
      const latestActive = await this.prisma.membershipCommissionConfig.findFirst({
        where: { isActive: true },
        orderBy: { version: 'desc' },
        select: { version: true },
      });

      if (latestActive) {
        targetVersion = latestActive.version;
      }
    }

    if (targetVersion) {
      const configs = await this.prisma.membershipCommissionConfig.findMany({
        where: { version: targetVersion },
        orderBy: { level: 'asc' },
      });

      if (configs.length > 0) {
        return configs.map((c) => ({
          ...c,
          percentage: Number(c.percentage),
        }));
      }
    }

    // Fallback if database table has no version records yet
    return DEFAULT_20_LEVEL_RATES.map((r, index) => ({
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
      throw new BadRequestException('Commission rate schedule must contain at least one level');
    }

    const levelSet = new Set<number>();
    for (const r of rates) {
      if (r.level < 1 || r.level > 20) {
        throw new BadRequestException(`Invalid level ${r.level}. Levels must be between 1 and 20.`);
      }
      if (levelSet.has(r.level)) {
        throw new BadRequestException(`Duplicate level entry found for level ${r.level}`);
      }
      levelSet.add(r.level);
    }

    return this.prisma.$transaction(async (tx) => {
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
   * Trigger-on-registration commission calculation engine.
   * Walks up the referral chain for up to 20 levels and records commission ledgers.
   */
  async processRegistrationCommissions(
    sourceMemberId: string,
    packageAmount: number = 1000,
    txClient?: Prisma.TransactionClient,
  ): Promise<MembershipCommissionResponseDto[]> {
    const db: any = txClient || this.prisma;

    // Idempotency check: Ensure commissions have not already been computed for this source member
    const existingCount = await db.membershipCommissionLedger.count({
      where: { sourceMemberId },
    });

    if (existingCount > 0) {
      this.logger.log(
        `Commissions already calculated for source member '${sourceMemberId}'. Skipping duplicate engine execution.`,
      );
      const existingLedgers = await db.membershipCommissionLedger.findMany({
        where: { sourceMemberId },
        orderBy: { level: 'asc' },
      });
      return existingLedgers.map((l: any) => this.mapLedgerToDto(l));
    }

    // Fetch newly registered source member
    const sourceMember = await db.member.findUnique({
      where: { id: sourceMemberId },
      select: { id: true, referrerId: true, memberCode: true, status: true },
    });

    if (!sourceMember) {
      throw new NotFoundException(`Source member with ID '${sourceMemberId}' not found`);
    }

    if (!sourceMember.referrerId) {
      this.logger.log(
        `Source member '${sourceMember.memberCode}' (${sourceMemberId}) has no referrer (Root/Direct). No upline commissions generated.`,
      );
      return [];
    }

    // Fetch active percentage schedule
    const activeConfigs = await this.getActiveConfig();
    const rateMap = new Map<number, number>();
    activeConfigs.forEach((c) => {
      rateMap.set(c.level, Number(c.percentage));
    });

    const generatedLedgers: any[] = [];
    let currentReferrerId: string | null = sourceMember.referrerId;
    let currentLevel = 1;
    const visited = new Set<string>([sourceMemberId]);

    while (currentReferrerId && currentLevel <= 20) {
      if (visited.has(currentReferrerId)) {
        this.logger.warn(
          `Cycle detected in referral chain for member '${sourceMemberId}' at level ${currentLevel} (Referrer ID: ${currentReferrerId}). Aborting upline traversal.`,
        );
        break;
      }
      visited.add(currentReferrerId);

      const beneficiary = await db.member.findUnique({
        where: { id: currentReferrerId },
        select: { id: true, referrerId: true, status: true, memberCode: true },
      });

      if (!beneficiary) {
        break;
      }

      const ratePercentage = rateMap.get(currentLevel) ?? 0;

      if (ratePercentage > 0) {
        const commissionAmount = (packageAmount * ratePercentage) / 100;

        const ledger = await db.membershipCommissionLedger.create({
          data: {
            sourceMemberId,
            beneficiaryMemberId: beneficiary.id,
            level: currentLevel,
            percentage: new Prisma.Decimal(ratePercentage),
            amount: new Prisma.Decimal(commissionAmount),
            status: CommissionStatus.CALCULATED,
          },
        });

        generatedLedgers.push(ledger);
      }

      currentReferrerId = beneficiary.referrerId;
      currentLevel++;
    }

    this.logger.log(
      `Successfully generated ${generatedLedgers.length} commission ledger entries for newly registered member '${sourceMember.memberCode}' (${sourceMemberId}).`,
    );

    return generatedLedgers.map((l) => this.mapLedgerToDto(l));
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
    const orderByField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';

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
      throw new NotFoundException(`Membership commission ledger with ID '${id}' not found`);
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
