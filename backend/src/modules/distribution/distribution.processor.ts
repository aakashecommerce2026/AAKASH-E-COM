import { Processor, Process } from '@nestjs/bull';
import type { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { DistributionService } from './distribution.service';

export interface DistributionJobData {
  batchId: string;
  cutoffDate?: string;
  membershipLedgerIds?: string[];
  repurchaseLedgerIds?: string[];
  memberIds?: string[];
  remarks?: string;
  actorId?: string;
  actorRole?: any;
}

@Processor('distribution-queue')
export class DistributionProcessor {
  private readonly logger = new Logger(DistributionProcessor.name);

  constructor(private readonly distributionService: DistributionService) {}

  @Process('process-batch')
  async handleDistributionBatch(job: Job<DistributionJobData>) {
    this.logger.log(
      `Processing distribution batch job #${job.id} for Batch ID '${job.data.batchId}' in background queue...`,
    );

    try {
      const result = await this.distributionService.executeBatchProcessing(
        job.data.batchId,
        job.data,
        job.data.actorId,
        job.data.actorRole,
      );

      this.logger.log(
        `✅ Distribution batch job #${job.id} completed successfully for Batch '${result.batchNo}' (${result.totalMembers} members, Net: ₹${result.totalNetAmount}).`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `❌ Distribution batch job #${job.id} failed for Batch ID '${job.data.batchId}': ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }
}
