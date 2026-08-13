import { Test, TestingModule } from '@nestjs/testing';
import { DistributionProcessor } from './distribution.processor';
import { DistributionService } from './distribution.service';

describe('DistributionProcessor Unit Tests', () => {
  let processor: DistributionProcessor;
  let distributionService: any;

  beforeEach(async () => {
    distributionService = {
      executeBatchProcessing: jest.fn().mockResolvedValue({
        id: 'batch-uuid-1',
        batchNo: 'BATCH-20260813-0001',
        totalMembers: 5,
        totalNetAmount: 4500.0,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DistributionProcessor,
        { provide: DistributionService, useValue: distributionService },
      ],
    }).compile();

    processor = module.get<DistributionProcessor>(DistributionProcessor);
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  it('should handle distribution batch job asynchronously and call executeBatchProcessing', async () => {
    const mockJob: any = {
      id: 'job-123',
      data: {
        batchId: 'batch-uuid-1',
        actorId: 'admin-1',
        actorRole: 'ADMIN',
      },
    };

    const res = await processor.handleDistributionBatch(mockJob);

    expect(res.id).toBe('batch-uuid-1');
    expect(distributionService.executeBatchProcessing).toHaveBeenCalledWith(
      'batch-uuid-1',
      mockJob.data,
      'admin-1',
      'ADMIN',
    );
  });
});
