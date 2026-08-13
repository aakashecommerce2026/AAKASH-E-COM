import {
  Injectable,
  OnModuleInit,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  RepurchaseCommissionConfigResponseDto,
  UpdateRepurchaseCommissionConfigDto,
} from './dto/repurchase-commission-config.dto';
import { CommissionStatus, MemberStatus, Prisma } from '@prisma/client';

export const DEFAULT_REPURCHASE_COMMISSION_RATES = [
  { level: 1, percentage: 1.50, description: 'Level 1 Repurchase Commission' },
  { level: 2, percentage: 0.75, description: 'Level 2 Repurchase Commission' },
  { level: 3, percentage: 0.45, description: 'Level 3 Repurchase Commission' },
  { level: 4, percentage: 0.30, description: 'Level 4 Repurchase Commission' },
  { level: 5, percentage: 0.20, description: 'Level 5 Repurchase Commission' },
  { level: 6, percentage: 0.15, description: 'Level 6 Repurchase Commission' },
  { level: 7, percentage: 0.15, description: 'Level 7 Repurchase Commission' },
  { level: 8, percentage: 0.15, description: 'Level 8 Repurchase Commission' },
  { level: 9, percentage: 0.15, description: 'Level 9 Repurchase Commission' },
  { level: 10, percentage: 0.15, description: 'Level 10 Repurchase Commission' },
  { level: 11, percentage: 0.15, description: 'Level 11 Repurchase Commission' },
  { level: 12, percentage: 0.15, description: 'Level 12 Repurchase Commission' },
  { level: 13, percentage: 0.15, description: 'Level 13 Repurchase Commission' },
  { level: 14, percentage: 0.15, description: 'Level 14 Repurchase Commission' },
  { level: 15, percentage: 0.15, description: 'Level 15 Repurchase Commission' },
  { level: 16, percentage: 0.07, description: 'Level 16 Repurchase Commission' },
  { level: 17, percentage: 0.06, description: 'Level 17 Repurchase Commission' },
  { level: 18, percentage: 0.06, description: 'Level 18 Repurchase Commission' },
  { level: 19, percentage: 0.06, description: 'Level 19 Repurchase Commission' },
  { level: 20, percentage: 0.05, description: 'Level 20 Repurchase Commission' },
];

export interface RepurchaseCommissionLedgerResponseDto {
  id: string;
  repurchaseEntryId: string;
  sourceMemberId: string;
  beneficiaryMemberId: string;
  level: number;
  percentage: number;
  amount: number;
  status: CommissionStatus;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class RepurchaseCommissionService implements OnModuleInit {
  private readonly logger = new Logger(RepurchaseCommissionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Application startup lifecycle hook.
   * Enforces validation check on app boot that active repurchase percentages sum to EXACTLY 5.00%.
   */
  async onModuleInit() {
    await this.validateStartupConfig();
  }

  /**
   * Validates configured repurchase percentages on startup.
   * Catches configuration typos immediately on boot.
   */
  async validateStartupConfig(): Promise<void> {
    const config = await this.getActiveConfig();

    const totalSum = config.reduce((acc, c) => acc + Number(c.percentage), 0);
    const roundedSum = Math.round(totalSum * 10000) / 10000;

    if (config.length !== 20 || Math.abs(roundedSum - 5.00) > 0.0001) {
      const errorMsg = `CRITICAL CONFIGURATION ERROR: Active Repurchase Commission Config has ${config.length} configured levels summing to ${roundedSum}%, but must sum to EXACTLY 5.00% across 20 levels!`;
      this.logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    this.logger.log(
      `✅ Repurchase Commission Startup Check Passed: 20 levels configured, total pool sum = ${roundedSum.toFixed(2)}%`,
    );
  }

  /**
   * Retrieves active or specified version of the 20-level repurchase commission rates schedule.
   */
  async getActiveConfig(
    version?: number,
    txClient?: Prisma.TransactionClient,
  ): Promise<RepurchaseCommissionConfigResponseDto[]> {
    const db: any = txClient || this.prisma;
    let targetVersion = version;

    if (!targetVersion) {
      const latestActive = await db.repurchaseCommissionConfig.findFirst({
        where: { isActive: true },
        orderBy: { version: 'desc' },
        select: { version: true },
      });

      if (latestActive) {
        targetVersion = latestActive.version;
      }
    }

    if (targetVersion) {
      const configs = await db.repurchaseCommissionConfig.findMany({
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

    // Fallback default rates if DB table is unseeded
    return DEFAULT_REPURCHASE_COMMISSION_RATES.map((r) => ({
      id: `default-v1-l${r.level}`,
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
   * Core Repurchase Commission Calculation Engine.
   * Calculates up to 20 levels of upline commissions for a repurchase entry.
   *
   * @param repurchaseEntryId Target repurchase entry UUID
   * @param txClient Optional Prisma transaction client for atomic execution
   */
  async calculateForEntry(
    repurchaseEntryId: string,
    txClient?: Prisma.TransactionClient,
  ): Promise<RepurchaseCommissionLedgerResponseDto[]> {
    const db: any = txClient || this.prisma;

    // 1. Fetch Repurchase Entry details
    const repurchaseEntry = await db.repurchaseEntry.findFirst({
      where: { id: repurchaseEntryId, deletedAt: null },
    });

    if (!repurchaseEntry) {
      throw new NotFoundException(`Repurchase entry with ID '${repurchaseEntryId}' not found`);
    }

    const memberId = repurchaseEntry.memberId;
    const repurchaseAmount = Number(repurchaseEntry.amount);

    // 2. Fetch purchasing member details
    const sourceMember = await db.member.findUnique({
      where: { id: memberId },
      select: { id: true, memberCode: true, referrerId: true, status: true },
    });

    if (!sourceMember) {
      throw new NotFoundException(`Member with ID '${memberId}' not found`);
    }

    if (!sourceMember.referrerId) {
      this.logger.log(
        `Member '${sourceMember.memberCode}' (${memberId}) has no referrer (Root/Direct). No repurchase upline commissions generated.`,
      );
      return [];
    }

    // 3. Fetch active 20-level repurchase percentage schedule
    const activeConfigs = await this.getActiveConfig(undefined, txClient);
    const rateMap = new Map<number, number>();
    activeConfigs.forEach((c) => {
      rateMap.set(c.level, Number(c.percentage));
    });

    // 4. Walk the upline up to 20 levels via Recursive CTE (with fallback for unit-test/mock environments)
    let uplineNodes: { id: string; memberCode?: string; referrerId?: string | null; status?: string; level: number }[] = [];

    try {
      if (typeof db.$queryRaw === 'function') {
        const rawNodes = await db.$queryRaw(Prisma.sql`
          WITH RECURSIVE upline AS (
            SELECT 
              m.id,
              m.member_code AS "memberCode",
              m.referrer_id AS "referrerId",
              m.status AS status,
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
              u.level + 1 AS level
            FROM members m
            INNER JOIN upline u ON m.id = u."referrerId"
            WHERE u.level < 20
          )
          SELECT id, "memberCode", "referrerId", status, level FROM upline ORDER BY level ASC LIMIT 20;
        `);
        if (Array.isArray(rawNodes) && rawNodes.length > 0) {
          uplineNodes = rawNodes.map((node: any) => ({
            id: node.id,
            memberCode: node.memberCode,
            referrerId: node.referrerId,
            status: node.status,
            level: Number(node.level),
          }));
        }
      }
    } catch (error) {
      this.logger.warn(
        `CTE query unhandled or mock environment (${(error as Error).message}). Using iterative fallback.`,
      );
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
          select: { id: true, referrerId: true, memberCode: true, status: true },
        });

        if (!parent) break;

        uplineNodes.push({
          id: parent.id,
          memberCode: parent.memberCode,
          referrerId: parent.referrerId,
          status: parent.status,
          level: lvl,
        });

        currentRefId = parent.referrerId;
        lvl++;
      }
    }

    // 5. Compute amount = repurchaseAmount * (levelPercentage / 100) and write ledger rows
    // Active members receive PENDING status; non-ACTIVE members receive HOLD status (flagged money-in-transit)
    const generatedLedgers: any[] = [];

    for (const node of uplineNodes) {
      if (node.level > 20) break;

      const ratePercentage = rateMap.get(node.level) ?? 0;

      if (ratePercentage > 0) {
        const commissionAmount = Math.round(repurchaseAmount * (ratePercentage / 100) * 100) / 100;

        const ledgerStatus =
          !node.status || node.status === MemberStatus.ACTIVE
            ? CommissionStatus.PENDING
            : CommissionStatus.HOLD;

        const ledger = await db.repurchaseCommissionLedger.create({
          data: {
            repurchaseEntryId,
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
      `Successfully generated ${generatedLedgers.length} repurchase commission ledger entries for repurchase transaction '${repurchaseEntry.transactionRef}' (Member ${sourceMember.memberCode}).`,
    );

    return generatedLedgers.map((l: any) => this.mapLedgerToDto(l));
  }

  /**
   * Validates that an array of rates contains exactly 20 levels (1 to 20) and sums to 5.00%.
   */
  validateRatesSum(rates: { level: number; percentage: number }[]): void {
    if (rates.length !== 20) {
      throw new BadRequestException(`Repurchase commission configuration must contain exactly 20 levels (provided ${rates.length})`);
    }

    const levels = new Set(rates.map((r) => r.level));
    for (let l = 1; l <= 20; l++) {
      if (!levels.has(l)) {
        throw new BadRequestException(`Missing configuration for level ${l}`);
      }
    }

    const total = rates.reduce((acc, r) => acc + Number(r.percentage), 0);
    const roundedTotal = Math.round(total * 10000) / 10000;

    if (Math.abs(roundedTotal - 5.00) > 0.0001) {
      throw new BadRequestException(
        `Configured repurchase commission percentages sum to ${roundedTotal}%, but must sum to EXACTLY 5.00%`,
      );
    }
  }

  /**
   * Admin updates/publishes a new version of the 20-level repurchase commission rates.
   */
  async updateConfig(dto: UpdateRepurchaseCommissionConfigDto, actorId?: string) {
    this.validateRatesSum(dto.rates);

    return this.prisma.$transaction(async (tx: any) => {
      const latestActive = await tx.repurchaseCommissionConfig.findFirst({
        where: { isActive: true },
        orderBy: { version: 'desc' },
        select: { version: true },
      });

      const nextVersion = (latestActive?.version || 0) + 1;

      // Deactivate older versions
      await tx.repurchaseCommissionConfig.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });

      // Insert new version rates
      await tx.repurchaseCommissionConfig.createMany({
        data: dto.rates.map((r) => ({
          version: nextVersion,
          level: r.level,
          percentage: new Prisma.Decimal(r.percentage),
          isActive: true,
          description: r.description || `Level ${r.level} Repurchase Commission`,
        })),
      });

      const created = await tx.repurchaseCommissionConfig.findMany({
        where: { version: nextVersion },
        orderBy: { level: 'asc' },
      });

      await this.auditService.logAction({
        actorId: actorId || null,
        actionType: 'UPDATE_REPURCHASE_COMMISSION_CONFIG',
        entityType: 'RepurchaseCommissionConfig',
        entityId: `v${nextVersion}`,
        metadata: {
          version: nextVersion,
          ratesCount: dto.rates.length,
          totalPoolPercentage: 5.0,
        },
      });

      return created.map((c: any) => ({
        ...c,
        percentage: Number(c.percentage),
      }));
    });
  }

  private mapLedgerToDto(ledger: any): RepurchaseCommissionLedgerResponseDto {
    return {
      id: ledger.id,
      repurchaseEntryId: ledger.repurchaseEntryId,
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
