import { Test, TestingModule } from '@nestjs/testing';
import { PromotionsService, calculateRankFromReferralCount, RANK_THRESHOLDS, MemberRank } from './promotions.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { MemberStatus } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';

describe('PromotionsService Unit Tests', () => {
  let service: PromotionsService;
  let prisma: any;
  let auditService: any;

  const mockMember = {
    id: 'member-uuid-1',
    memberCode: 'AK10001',
    name: 'Alice Johnson',
    rank: MemberRank.NONE,
    status: MemberStatus.ACTIVE,
  };

  beforeEach(async () => {
    prisma = {
      member: {
        findUnique: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
      promotionHistory: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
    };

    auditService = {
      logAction: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PromotionsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<PromotionsService>(PromotionsService);
  });

  describe('calculateRankFromReferralCount', () => {
    it('should return NONE for less than 20 direct referrals', () => {
      expect(calculateRankFromReferralCount(0)).toBe(MemberRank.NONE);
      expect(calculateRankFromReferralCount(19)).toBe(MemberRank.NONE);
    });

    it('should return BRONZE for 20 to 49 direct referrals', () => {
      expect(calculateRankFromReferralCount(20)).toBe(MemberRank.BRONZE);
      expect(calculateRankFromReferralCount(49)).toBe(MemberRank.BRONZE);
    });

    it('should return SILVER for 50 to 89 direct referrals', () => {
      expect(calculateRankFromReferralCount(50)).toBe(MemberRank.SILVER);
      expect(calculateRankFromReferralCount(89)).toBe(MemberRank.SILVER);
    });

    it('should return GOLD for 90 to 129 direct referrals', () => {
      expect(calculateRankFromReferralCount(90)).toBe(MemberRank.GOLD);
      expect(calculateRankFromReferralCount(129)).toBe(MemberRank.GOLD);
    });

    it('should return PLATINUM for 130 or more direct referrals', () => {
      expect(calculateRankFromReferralCount(130)).toBe(MemberRank.PLATINUM);
      expect(calculateRankFromReferralCount(250)).toBe(MemberRank.PLATINUM);
    });
  });

  describe('evaluateAndPromoteMember', () => {
    it('should throw NotFoundException if member does not exist', async () => {
      prisma.member.findUnique.mockResolvedValue(null);

      await expect(service.evaluateAndPromoteMember('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should promote member from NONE -> BRONZE when active direct referrals hit 20', async () => {
      prisma.member.findUnique.mockResolvedValue(mockMember);
      prisma.member.count.mockResolvedValue(20);
      prisma.member.update.mockResolvedValue({ ...mockMember, rank: MemberRank.BRONZE });
      prisma.promotionHistory.create.mockResolvedValue({
        id: 'promo-1',
        memberId: mockMember.id,
        previousRank: MemberRank.NONE,
        newRank: MemberRank.BRONZE,
        directReferralsCount: 20,
        promotedAt: new Date(),
      });

      const res = await service.evaluateAndPromoteMember(mockMember.id);

      expect(res.promoted).toBe(true);
      expect(res.previousRank).toBe(MemberRank.NONE);
      expect(res.newRank).toBe(MemberRank.BRONZE);
      expect(prisma.member.update).toHaveBeenCalledWith({
        where: { id: mockMember.id },
        data: { rank: MemberRank.BRONZE },
      });
      expect(prisma.promotionHistory.create).toHaveBeenCalled();
      expect(auditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          actionType: 'MEMBER_PROMOTED',
          entityId: mockMember.id,
        }),
      );
    });

    it('should promote member from BRONZE -> SILVER when active direct referrals hit 50', async () => {
      const bronzeMember = { ...mockMember, rank: MemberRank.BRONZE };
      prisma.member.findUnique.mockResolvedValue(bronzeMember);
      prisma.member.count.mockResolvedValue(50);
      prisma.member.update.mockResolvedValue({ ...bronzeMember, rank: MemberRank.SILVER });

      const res = await service.evaluateAndPromoteMember(bronzeMember.id);

      expect(res.promoted).toBe(true);
      expect(res.newRank).toBe(MemberRank.SILVER);
    });

    it('should promote member from SILVER -> GOLD when active direct referrals hit 90', async () => {
      const silverMember = { ...mockMember, rank: MemberRank.SILVER };
      prisma.member.findUnique.mockResolvedValue(silverMember);
      prisma.member.count.mockResolvedValue(90);

      const res = await service.evaluateAndPromoteMember(silverMember.id);

      expect(res.promoted).toBe(true);
      expect(res.newRank).toBe(MemberRank.GOLD);
    });

    it('should promote member from GOLD -> PLATINUM when active direct referrals hit 130', async () => {
      const goldMember = { ...mockMember, rank: MemberRank.GOLD };
      prisma.member.findUnique.mockResolvedValue(goldMember);
      prisma.member.count.mockResolvedValue(130);

      const res = await service.evaluateAndPromoteMember(goldMember.id);

      expect(res.promoted).toBe(true);
      expect(res.newRank).toBe(MemberRank.PLATINUM);
    });

    it('should NOT promote if active direct referrals count does not meet next threshold', async () => {
      prisma.member.findUnique.mockResolvedValue(mockMember);
      prisma.member.count.mockResolvedValue(15);

      const res = await service.evaluateAndPromoteMember(mockMember.id);

      expect(res.promoted).toBe(false);
      expect(prisma.member.update).not.toHaveBeenCalled();
    });
  });

  describe('getPromotionProgress', () => {
    it('should return correct progress metrics for member needing 8 more for BRONZE', async () => {
      prisma.member.findUnique.mockResolvedValue(mockMember);
      prisma.member.count.mockResolvedValue(12);
      prisma.promotionHistory.findMany.mockResolvedValue([]);

      const progress = await service.getPromotionProgress(mockMember.id);

      expect(progress.currentRank).toBe(MemberRank.NONE);
      expect(progress.nextRank).toBe(MemberRank.BRONZE);
      expect(progress.activeDirectCount).toBe(12);
      expect(progress.remainingReferralsNeeded).toBe(8);
      expect(progress.progressPercentage).toBe(60); // 12/20 = 60%
    });

    it('should return MAX for PLATINUM member', async () => {
      const platMember = { ...mockMember, rank: MemberRank.PLATINUM };
      prisma.member.findUnique.mockResolvedValue(platMember);
      prisma.prisma = prisma;
      prisma.member.count.mockResolvedValue(150);
      prisma.promotionHistory.findMany.mockResolvedValue([]);

      const progress = await service.getPromotionProgress(platMember.id);

      expect(progress.currentRank).toBe(MemberRank.PLATINUM);
      expect(progress.nextRank).toBe('MAX');
      expect(progress.remainingReferralsNeeded).toBe(0);
      expect(progress.progressPercentage).toBe(100);
    });
  });
});
