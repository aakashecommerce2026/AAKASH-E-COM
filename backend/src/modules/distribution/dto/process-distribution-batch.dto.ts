import { IsOptional, IsString, IsArray, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ProcessDistributionBatchDto {
  @ApiPropertyOptional({
    example: '2026-08-31T23:59:59.999Z',
    description:
      'Process all pending ledgers created on or before this cutoff date',
  })
  @Transform(({ obj, value }) => value || obj?.cutoff_date || obj?.cutoffDate)
  @IsOptional()
  @IsDateString()
  cutoffDate?: string;

  @ApiPropertyOptional({
    description:
      'Explicit list of membership commission ledger UUIDs to process',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  membershipLedgerIds?: string[];

  @ApiPropertyOptional({
    description:
      'Explicit list of repurchase commission ledger UUIDs to process',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  repurchaseLedgerIds?: string[];

  @ApiPropertyOptional({
    description: 'Filter processing to specific member UUIDs',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  memberIds?: string[];

  @ApiPropertyOptional({
    example: 'Monthly payout run for August 2026',
    description: 'Batch notes or remarks',
  })
  @IsOptional()
  @IsString()
  remarks?: string;
}
