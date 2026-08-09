import { Test, TestingModule } from '@nestjs/testing';
import { HierarchyController } from './hierarchy.controller';
import { HierarchyService } from './hierarchy.service';

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
    const result = await controller.getDownline('member-uuid-1', { maxLevels: 20 });

    expect(hierarchyService.getDownline).toHaveBeenCalledWith('member-uuid-1', 20);
    expect(result).toEqual([mockNode]);
  });

  it('getDirectReferrals should delegate to hierarchyService with maxLevels 1', async () => {
    const result = await controller.getDirectReferrals('member-uuid-1');

    expect(hierarchyService.getDownline).toHaveBeenCalledWith('member-uuid-1', 1);
    expect(result).toEqual([mockNode]);
  });

  it('getUpline should delegate to hierarchyService with upline levels', async () => {
    const result = await controller.getUpline('member-uuid-1', { maxLevels: 20 });

    expect(hierarchyService.getUpline).toHaveBeenCalledWith('member-uuid-1', 20);
    expect(result).toEqual([mockNode]);
  });
});
