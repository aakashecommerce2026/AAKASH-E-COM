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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var PromotionsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromotionsService = exports.RANK_THRESHOLDS = exports.MemberRank = void 0;
exports.calculateRankFromReferralCount = calculateRankFromReferralCount;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const client_1 = require("@prisma/client");
var MemberRank;
(function (MemberRank) {
    MemberRank["NONE"] = "NONE";
    MemberRank["BRONZE"] = "BRONZE";
    MemberRank["SILVER"] = "SILVER";
    MemberRank["GOLD"] = "GOLD";
    MemberRank["PLATINUM"] = "PLATINUM";
})(MemberRank || (exports.MemberRank = MemberRank = {}));
exports.RANK_THRESHOLDS = {
    BRONZE: 20,
    SILVER: 50,
    GOLD: 90,
    PLATINUM: 130,
};
const RANK_HIERARCHY = {
    [MemberRank.NONE]: 0,
    [MemberRank.BRONZE]: 1,
    [MemberRank.SILVER]: 2,
    [MemberRank.GOLD]: 3,
    [MemberRank.PLATINUM]: 4,
};
function calculateRankFromReferralCount(count) {
    if (count >= exports.RANK_THRESHOLDS.PLATINUM)
        return MemberRank.PLATINUM;
    if (count >= exports.RANK_THRESHOLDS.GOLD)
        return MemberRank.GOLD;
    if (count >= exports.RANK_THRESHOLDS.SILVER)
        return MemberRank.SILVER;
    if (count >= exports.RANK_THRESHOLDS.BRONZE)
        return MemberRank.BRONZE;
    return MemberRank.NONE;
}
let PromotionsService = PromotionsService_1 = class PromotionsService {
    prisma;
    auditService;
    logger = new common_1.Logger(PromotionsService_1.name);
    constructor(prisma, auditService) {
        this.prisma = prisma;
        this.auditService = auditService;
    }
    async evaluateAndPromoteMember(memberId, txPrisma) {
        const client = (txPrisma || this.prisma);
        const member = (await client.member.findUnique({
            where: { id: memberId },
            select: { id: true, memberCode: true, name: true, rank: true, status: true },
        }));
        if (!member) {
            throw new common_1.NotFoundException(`Member with ID '${memberId}' not found`);
        }
        const activeDirectReferralsCount = await client.member.count({
            where: {
                referrerId: memberId,
                status: client_1.MemberStatus.ACTIVE,
            },
        });
        const targetRank = calculateRankFromReferralCount(activeDirectReferralsCount);
        const currentRankOrder = RANK_HIERARCHY[member.rank] || 0;
        const targetRankOrder = RANK_HIERARCHY[targetRank] || 0;
        if (targetRankOrder > currentRankOrder) {
            const previousRank = member.rank;
            await client.member.update({
                where: { id: memberId },
                data: { rank: targetRank },
            });
            const historyRecord = await client.promotionHistory.create({
                data: {
                    memberId,
                    previousRank,
                    newRank: targetRank,
                    directReferralsCount: activeDirectReferralsCount,
                },
            });
            this.logger.log(`🎉 Member ${member.memberCode} (${member.name}) PROMOTED from ${previousRank} -> ${targetRank} with ${activeDirectReferralsCount} active direct referrals!`);
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
            currentRank: member.rank,
            targetRank,
            directReferralsCount: activeDirectReferralsCount,
        };
    }
    async getPromotionProgress(memberId) {
        const member = (await this.prisma.member.findUnique({
            where: { id: memberId },
            select: { id: true, memberCode: true, name: true, rank: true, joiningDate: true },
        }));
        if (!member) {
            throw new common_1.NotFoundException(`Member with ID '${memberId}' not found`);
        }
        const activeDirectCount = await this.prisma.member.count({
            where: {
                referrerId: memberId,
                status: client_1.MemberStatus.ACTIVE,
            },
        });
        const currentRank = member.rank || MemberRank.NONE;
        let nextRank = MemberRank.BRONZE;
        let targetThreshold = exports.RANK_THRESHOLDS.BRONZE;
        let baseThreshold = 0;
        if (currentRank === MemberRank.NONE) {
            nextRank = MemberRank.BRONZE;
            targetThreshold = exports.RANK_THRESHOLDS.BRONZE;
            baseThreshold = 0;
        }
        else if (currentRank === MemberRank.BRONZE) {
            nextRank = MemberRank.SILVER;
            targetThreshold = exports.RANK_THRESHOLDS.SILVER;
            baseThreshold = exports.RANK_THRESHOLDS.BRONZE;
        }
        else if (currentRank === MemberRank.SILVER) {
            nextRank = MemberRank.GOLD;
            targetThreshold = exports.RANK_THRESHOLDS.GOLD;
            baseThreshold = exports.RANK_THRESHOLDS.SILVER;
        }
        else if (currentRank === MemberRank.GOLD) {
            nextRank = MemberRank.PLATINUM;
            targetThreshold = exports.RANK_THRESHOLDS.PLATINUM;
            baseThreshold = exports.RANK_THRESHOLDS.GOLD;
        }
        else if (currentRank === MemberRank.PLATINUM) {
            nextRank = 'MAX';
            targetThreshold = exports.RANK_THRESHOLDS.PLATINUM;
            baseThreshold = exports.RANK_THRESHOLDS.PLATINUM;
        }
        const remainingReferralsNeeded = nextRank === 'MAX' ? 0 : Math.max(0, targetThreshold - activeDirectCount);
        let progressPercentage = 100;
        if (nextRank !== 'MAX') {
            const stepTotal = targetThreshold - baseThreshold;
            const stepProgress = Math.max(0, activeDirectCount - baseThreshold);
            progressPercentage = Math.min(100, Math.round((stepProgress / stepTotal) * 100));
        }
        const history = await this.prisma.promotionHistory.findMany({
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
            rankMilestones: exports.RANK_THRESHOLDS,
            history,
        };
    }
    async recalculateAllMemberRanks() {
        const members = (await this.prisma.member.findMany({
            select: { id: true, memberCode: true, rank: true },
        }));
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
};
exports.PromotionsService = PromotionsService;
exports.PromotionsService = PromotionsService = PromotionsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], PromotionsService);
//# sourceMappingURL=promotions.service.js.map