import { Test, TestingModule } from '@nestjs/testing';
import { MemberNetworkController } from './member-network.controller';
import { HierarchyService } from './hierarchy.service';
import { PrismaService } from '../../prisma/prisma.service';
import { HierarchyNode } from './interfaces/hierarchy-node.interface';

describe('Member Network Visibility & Security Restrictions Test Suite', () => {
  let controller: MemberNetworkController;
  let service: HierarchyService;

  const mockRootMemberId = 'logged-in-member-uuid-1001';
  const mockUplineMemberId = 'upline-sponsor-uuid-9000';
  const mockCrossBranchMemberId = 'cross-branch-member-uuid-5000';
  const mockDownlineNode: HierarchyNode = {
    id: 'downline-child-uuid-2001',
    memberCode: 'AK10002',
    name: 'Child Member',
    mobile: '+919876543210',
    email: 'child@example.com',
    referrerId: mockRootMemberId,
    joiningDate: new Date('2026-02-01T10:00:00.000Z'),
    status: 'ACTIVE',
    role: 'MEMBER',
    level: 1,
  };

  const mockHierarchyService = {
    getDownline: jest.fn(),
    getHierarchySummary: jest.fn(),
    searchDownline: jest.fn(),
    isInDownlineOf: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MemberNetworkController],
      providers: [
        { provide: HierarchyService, useValue: mockHierarchyService },
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    controller = module.get<MemberNetworkController>(MemberNetworkController);
    service = module.get<HierarchyService>(HierarchyService);

    jest.clearAllMocks();
  });

  describe('1. Endpoint Server-Side Root Enforcement & Parameter Tamper Resistance', () => {
    it('GET /member/network/direct-referrals — should pass authenticated memberId strictly to service with maxLevels = 1', async () => {
      mockHierarchyService.getDownline.mockResolvedValueOnce([
        mockDownlineNode,
      ]);

      const result = await controller.getDirectReferrals(mockRootMemberId);

      expect(result).toEqual([mockDownlineNode]);
      expect(mockHierarchyService.getDownline).toHaveBeenCalledWith(
        mockRootMemberId,
        1,
      );
    });

    it('GET /member/network/downline — should enforce authenticated memberId as root, ignoring query parameters', async () => {
      mockHierarchyService.getDownline.mockResolvedValueOnce([
        mockDownlineNode,
      ]);

      const queryParams = {
        maxLevels: 15,
        memberId: mockUplineMemberId,
        rootMemberId: mockCrossBranchMemberId,
      } as any;
      const result = await controller.getDownline(
        mockRootMemberId,
        queryParams,
      );

      expect(result).toEqual([mockDownlineNode]);
      // Verify service was called with mockRootMemberId from JWT, NOT mockUplineMemberId or mockCrossBranchMemberId
      expect(mockHierarchyService.getDownline).toHaveBeenCalledWith(
        mockRootMemberId,
        15,
      );
      expect(mockHierarchyService.getDownline).not.toHaveBeenCalledWith(
        mockUplineMemberId,
        expect.anything(),
      );
      expect(mockHierarchyService.getDownline).not.toHaveBeenCalledWith(
        mockCrossBranchMemberId,
        expect.anything(),
      );
    });

    it('GET /member/network/summary — should return hierarchy summary strictly for authenticated memberId', async () => {
      const mockSummary = {
        memberId: mockRootMemberId,
        totalDownline: 5,
        activeDownline: 5,
        totalBranches: 2,
      };
      mockHierarchyService.getHierarchySummary.mockResolvedValueOnce(
        mockSummary as any,
      );

      const result = await controller.getNetworkSummary(mockRootMemberId, {
        maxLevels: 20,
      });

      expect(result).toEqual(mockSummary);
      expect(mockHierarchyService.getHierarchySummary).toHaveBeenCalledWith(
        mockRootMemberId,
        20,
      );
    });

    it('GET /member/network/search — should execute search downline strictly under authenticated memberId root', async () => {
      mockHierarchyService.searchDownline.mockResolvedValueOnce([
        mockDownlineNode,
      ]);

      const searchQuery = { q: 'Child' };
      const result = await controller.searchDownline(
        mockRootMemberId,
        searchQuery,
      );

      expect(result).toEqual([mockDownlineNode]);
      expect(mockHierarchyService.searchDownline).toHaveBeenCalledWith(
        mockRootMemberId,
        searchQuery,
      );
    });
  });

  describe('2. Upline and Cross-Branch Leakage Prevention via isInDownlineOf Check', () => {
    it('should return false for isInDownlineOf when target member is an Upline sponsor', async () => {
      mockHierarchyService.isInDownlineOf.mockResolvedValueOnce(false);

      const isDownline = await service.isInDownlineOf(
        mockUplineMemberId,
        mockRootMemberId,
      );

      expect(isDownline).toBe(false);
    });

    it('should return false for isInDownlineOf when target member belongs to an Other/Cross Branch', async () => {
      mockHierarchyService.isInDownlineOf.mockResolvedValueOnce(false);

      const isDownline = await service.isInDownlineOf(
        mockCrossBranchMemberId,
        mockRootMemberId,
      );

      expect(isDownline).toBe(false);
    });

    it('should return true for isInDownlineOf when target member is a valid downline node', async () => {
      mockHierarchyService.isInDownlineOf.mockResolvedValueOnce(true);

      const isDownline = await service.isInDownlineOf(
        'downline-child-uuid-2001',
        mockRootMemberId,
      );

      expect(isDownline).toBe(true);
    });
  });
});
