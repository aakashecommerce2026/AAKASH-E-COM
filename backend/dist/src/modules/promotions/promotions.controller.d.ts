import { PromotionsService } from './promotions.service';
export declare class PromotionsController {
    private readonly promotionsService;
    constructor(promotionsService: PromotionsService);
    getMyStatus(req: any): Promise<{
        memberId: any;
        memberCode: any;
        name: any;
        currentRank: any;
        nextRank: "MAX" | import("./promotions.service").MemberRank.BRONZE | import("./promotions.service").MemberRank.SILVER | import("./promotions.service").MemberRank.GOLD | import("./promotions.service").MemberRank.PLATINUM;
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
    getMemberProgress(memberId: string, req: any): Promise<{
        memberId: any;
        memberCode: any;
        name: any;
        currentRank: any;
        nextRank: "MAX" | import("./promotions.service").MemberRank.BRONZE | import("./promotions.service").MemberRank.SILVER | import("./promotions.service").MemberRank.GOLD | import("./promotions.service").MemberRank.PLATINUM;
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
    recalculateAllRanks(): Promise<{
        evaluatedCount: number;
        promotedCount: number;
        promotions: {
            memberId: any;
            memberCode: any;
            previousRank: import("./promotions.service").MemberRank | undefined;
            newRank: import("./promotions.service").MemberRank | undefined;
            directReferralsCount: any;
        }[];
    }>;
}
