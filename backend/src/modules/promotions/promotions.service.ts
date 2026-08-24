import { Injectable, NotFoundException, Logger, Optional } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { MemberStatus, Prisma } from '@prisma/client';

export enum MemberRank {
  NONE = 'NONE',
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM',
}

export const RANK_THRESHOLDS = {
  BRONZE: 20,
  SILVER: 50,  // 20 + 30
  GOLD: 90,    // 50 + 40
  PLATINUM: 130, // 90 + 40
};

const RANK_HIERARCHY: Record<MemberRank, number> = {
  [MemberRank.NONE]: 0,
  [MemberRank.BRONZE]: 1,
  [MemberRank.SILVER]: 2,
  [MemberRank.GOLD]: 3,
  [MemberRank.PLATINUM]: 4,
};

export function calculateRankFromReferralCount(count: number): MemberRank {
  if (count >= RANK_THRESHOLDS.PLATINUM) return MemberRank.PLATINUM;
  if (count >= RANK_THRESHOLDS.GOLD) return MemberRank.GOLD;
  if (count >= RANK_THRESHOLDS.SILVER) return MemberRank.SILVER;
  if (count >= RANK_THRESHOLDS.BRONZE) return MemberRank.BRONZE;
  return MemberRank.NONE;
}

@Injectable()
export class PromotionsService {
  private readonly logger = new Logger(PromotionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly auditService?: AuditService,
  ) {}

  /**
   * Evaluate a member's direct active downline count and auto-promote if milestone reached.
   */
  async evaluateAndPromoteMember(memberId: string, txPrisma?: Prisma.TransactionClient) {
    const client = (txPrisma || this.prisma) as any;

    const member = (await client.member.findUnique({
      where: { id: memberId },
      select: { id: true, memberCode: true, name: true, rank: true, status: true } as any,
    })) as any;

    if (!member) {
      throw new NotFoundException(`Member with ID '${memberId}' not found`);
    }

    const activeDirectReferralsCount = await client.member.count({
      where: {
        referrerId: memberId,
        status: MemberStatus.ACTIVE,
      },
    });

    const targetRank = calculateRankFromReferralCount(activeDirectReferralsCount);
    const currentRankOrder = RANK_HIERARCHY[member.rank as MemberRank] || 0;
    const targetRankOrder = RANK_HIERARCHY[targetRank] || 0;

    if (targetRankOrder > currentRankOrder) {
      // Execute Rank Upgrade
      const previousRank = member.rank as MemberRank;

      await client.member.update({
        where: { id: memberId },
        data: { rank: targetRank } as any,
      });

      const historyRecord = await client.promotionHistory.create({
        data: {
          memberId,
          previousRank,
          newRank: targetRank,
          directReferralsCount: activeDirectReferralsCount,
        },
      });

      this.logger.log(
        `🎉 Member ${member.memberCode} (${member.name}) PROMOTED from ${previousRank} -> ${targetRank} with ${activeDirectReferralsCount} active direct referrals!`,
      );

      if (this.auditService && !txPrisma) {
        await this.auditService.logAction({
          actionType: 'MEMBER_PROMOTED',
          entityType: 'Member',
          entityId: member.id,
          metadata: {
            memberCode: member.memberCode,
            previousRank,
            newRank: targetRank,
            directReferralsCount: activeDirectReferralsCount,
          },
        });
      }

      return {
        promoted: true,
        previousRank,
        newRank: targetRank,
        directReferralsCount: activeDirectReferralsCount,
        historyRecord,
      };
    }

    return {
      promoted: false,
      currentRank: member.rank as MemberRank,
      targetRank,
      directReferralsCount: activeDirectReferralsCount,
    };
  }

  /**
   * Get member rank status, progress metrics towards next promotion, and history log.
   */
  async getPromotionProgress(memberId: string) {
    const member = (await this.prisma.member.findUnique({
      where: { id: memberId },
      select: { id: true, memberCode: true, name: true, rank: true, joiningDate: true } as any,
    })) as any;

    if (!member) {
      throw new NotFoundException(`Member with ID '${memberId}' not found`);
    }

    const activeDirectCount = await this.prisma.member.count({
      where: {
        referrerId: memberId,
        status: MemberStatus.ACTIVE,
      },
    });

    const currentRank = member.rank || MemberRank.NONE;
    let nextRank: MemberRank | 'MAX' = MemberRank.BRONZE;
    let targetThreshold = RANK_THRESHOLDS.BRONZE;
    let baseThreshold = 0;

    if (currentRank === MemberRank.NONE) {
      nextRank = MemberRank.BRONZE;
      targetThreshold = RANK_THRESHOLDS.BRONZE;
      baseThreshold = 0;
    } else if (currentRank === MemberRank.BRONZE) {
      nextRank = MemberRank.SILVER;
      targetThreshold = RANK_THRESHOLDS.SILVER;
      baseThreshold = RANK_THRESHOLDS.BRONZE;
    } else if (currentRank === MemberRank.SILVER) {
      nextRank = MemberRank.GOLD;
      targetThreshold = RANK_THRESHOLDS.GOLD;
      baseThreshold = RANK_THRESHOLDS.SILVER;
    } else if (currentRank === MemberRank.GOLD) {
      nextRank = MemberRank.PLATINUM;
      targetThreshold = RANK_THRESHOLDS.PLATINUM;
      baseThreshold = RANK_THRESHOLDS.GOLD;
    } else if (currentRank === MemberRank.PLATINUM) {
      nextRank = 'MAX';
      targetThreshold = RANK_THRESHOLDS.PLATINUM;
      baseThreshold = RANK_THRESHOLDS.PLATINUM;
    }

    const remainingReferralsNeeded = nextRank === 'MAX' ? 0 : Math.max(0, targetThreshold - activeDirectCount);

    let progressPercentage = 100;
    if (nextRank !== 'MAX') {
      const stepTotal = targetThreshold - baseThreshold;
      const stepProgress = Math.max(0, activeDirectCount - baseThreshold);
      progressPercentage = Math.min(100, Math.round((stepProgress / stepTotal) * 100));
    }

    const history = await (this.prisma as any).promotionHistory.findMany({
      where: { memberId },
      orderBy: { promotedAt: 'desc' },
    });

    return {
      memberId: member.id,
      memberCode: member.memberCode,
      name: member.name,
      currentRank,
      nextRank,
      activeDirectCount,
      targetThreshold,
      remainingReferralsNeeded,
      progressPercentage,
      rankMilestones: RANK_THRESHOLDS,
      history,
    };
  }

  /**
   * Bulk recalculate ranks for all active members in system (Admin Utility).
   */
  async recalculateAllMemberRanks() {
    const members = (await this.prisma.member.findMany({
      select: { id: true, memberCode: true, rank: true } as any,
    })) as any[];

    let promotedCount = 0;
    const promotionResults = [];

    for (const m of members) {
      const result = await this.evaluateAndPromoteMember(m.id);
      if (result.promoted) {
        promotedCount++;
        promotionResults.push({
          memberId: m.id,
          memberCode: m.memberCode,
          previousRank: result.previousRank,
          newRank: result.newRank,
          directReferralsCount: result.directReferralsCount,
        });
      }
    }

    return {
      evaluatedCount: members.length,
      promotedCount,
      promotions: promotionResults,
    };
  }
}
