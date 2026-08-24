import { Test, TestingModule } from '@nestjs/testing';
import { HierarchyController } from './hierarchy.controller';
import { HierarchyService } from './hierarchy.service';
import { NetworkGrowthGroupBy } from './dto/network-growth-query.dto';

describe('HierarchyController', () => {
  let controller: HierarchyController;
  let hierarchyService: any;

  const mockNode = {
    id: 'member-uuid-1',
    memberCode: 'AK10001',
    name: 'John Doe',
    level: 1,
  };

  beforeEach(async () => {
    hierarchyService = {
      getDownline: jest.fn().mockResolvedValue([mockNode]),
      getUpline: jest.fn().mockResolvedValue([mockNode]),
      searchDownline: jest.fn().mockResolvedValue([mockNode]),
      getNetworkGrowth: jest
        .fn()
        .mockResolvedValue([{ period: '2026-08', level: 1, joinCount: 1 }]),
      getBranchCounts: jest
        .fn()
        .mockResolvedValue([{ branchRootId: 'b-1', totalDownlineInBranch: 5 }]),
      getHierarchySummary: jest
        .fn()
        .mockResolvedValue({ totalDownline: 10, totalBranches: 2 }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HierarchyController],
      providers: [{ provide: HierarchyService, useValue: hierarchyService }],
    }).compile();

    controller = module.get<HierarchyController>(HierarchyController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('getDownline should delegate to hierarchyService with levels parameter', async () => {
    const result = await controller.getDownline('member-uuid-1', {
      maxLevels: 20,
    });

    expect(hierarchyService.getDownline).toHaveBeenCalledWith(
      'member-uuid-1',
      20,
    );
    expect(result).toEqual([mockNode]);
  });

  it('getDirectReferrals should delegate to hierarchyService with maxLevels 1', async () => {
    const result = await controller.getDirectReferrals('member-uuid-1');

    expect(hierarchyService.getDownline).toHaveBeenCalledWith(
      'member-uuid-1',
      1,
    );
    expect(result).toEqual([mockNode]);
  });

  it('getUpline should delegate to hierarchyService with upline levels', async () => {
    const result = await controller.getUpline('member-uuid-1', {
      maxLevels: 20,
    });

    expect(hierarchyService.getUpline).toHaveBeenCalledWith(
      'member-uuid-1',
      20,
    );
    expect(result).toEqual([mockNode]);
  });

  it('searchDownline should delegate to hierarchyService searchDownline method', async () => {
    const query = { q: 'John', maxLevels: 20 };
    const result = await controller.searchDownline('member-uuid-1', query);

    expect(hierarchyService.searchDownline).toHaveBeenCalledWith(
      'member-uuid-1',
      query,
    );
    expect(result).toEqual([mockNode]);
  });

  it('getNetworkGrowth should delegate to hierarchyService getNetworkGrowth method', async () => {
    const query = { groupBy: NetworkGrowthGroupBy.MONTH, maxLevels: 20 };
    const result = await controller.getNetworkGrowth('member-uuid-1', query);

    expect(hierarchyService.getNetworkGrowth).toHaveBeenCalledWith(
      'member-uuid-1',
      query,
    );
    expect(result).toHaveLength(1);
  });

  it('getBranchCounts should delegate to hierarchyService getBranchCounts method', async () => {
    const result = await controller.getBranchCounts('member-uuid-1', {
      maxLevels: 20,
    });

    expect(hierarchyService.getBranchCounts).toHaveBeenCalledWith(
      'member-uuid-1',
      20,
    );
    expect(result).toEqual([{ branchRootId: 'b-1', totalDownlineInBranch: 5 }]);
  });

  it('getHierarchySummary should delegate to hierarchyService getHierarchySummary method', async () => {
    const result = await controller.getHierarchySummary('member-uuid-1', {
      maxLevels: 20,
    });

    expect(hierarchyService.getHierarchySummary).toHaveBeenCalledWith(
      'member-uuid-1',
      20,
    );
    expect(result).toEqual({ totalDownline: 10, totalBranches: 2 });
  });
});
