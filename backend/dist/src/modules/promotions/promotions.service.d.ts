import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { Prisma } from '@prisma/client';
export declare enum MemberRank {
    NONE = "NONE",
    BRONZE = "BRONZE",
    SILVER = "SILVER",
    GOLD = "GOLD",
    PLATINUM = "PLATINUM"
}
export declare const RANK_THRESHOLDS: {
    BRONZE: number;
    SILVER: number;
    GOLD: number;
    PLATINUM: number;
};
export declare function calculateRankFromReferralCount(count: number): MemberRank;
export declare class PromotionsService {
    private readonly prisma;
    private readonly auditService?;
    private readonly logger;
    constructor(prisma: PrismaService, auditService?: AuditService | undefined);
    evaluateAndPromoteMember(memberId: string, txPrisma?: Prisma.TransactionClient): Promise<{
        promoted: boolean;
        previousRank: MemberRank;
        newRank: MemberRank;
        directReferralsCount: any;
        historyRecord: any;
        currentRank?: undefined;
        targetRank?: undefined;
    } | {
        promoted: boolean;
        currentRank: MemberRank;
        targetRank: MemberRank;
        directReferralsCount: any;
        previousRank?: undefined;
        newRank?: undefined;
        historyRecord?: undefined;
    }>;
    getPromotionProgress(memberId: string): Promise<{
        memberId: any;
        memberCode: any;
        name: any;
        currentRank: any;
        nextRank: MemberRank.BRONZE | MemberRank.SILVER | MemberRank.GOLD | MemberRank.PLATINUM | "MAX";
        activeDirectCount: number;
        targetThreshold: number;
        remainingReferralsNeeded: number;
        progressPercentage: number;
        rankMilestones: {
            BRONZE: number;
            SILVER: number;
            GOLD: number;
            PLATINUM: number;
        };
        history: any;
    }>;
    recalculateAllMemberRanks(): Promise<{
        evaluatedCount: number;
        promotedCount: number;
        promotions: {
            memberId: any;
            memberCode: any;
            previousRank: MemberRank | undefined;
            newRank: MemberRank | undefined;
            directReferralsCount: any;
        }[];
    }>;
}
