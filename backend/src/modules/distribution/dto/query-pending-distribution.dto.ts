import { IsOptional, IsString, IsInt, IsDateString, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryPendingDistributionDto {
  @ApiPropertyOptional({ description: 'Filter cutoff start date (ISO string)' })
  @Transform(({ obj, value }) => value || obj?.start_date || obj?.startDate)
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Filter cutoff end date (ISO string e.g. 2026-08-31)' })
  @Transform(({ obj, value }) => value || obj?.end_date || obj?.endDate || obj?.cutoff_date || obj?.cutoffDate)
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Filter by beneficiary member ID' })
  @Transform(({ obj, value }) => value || obj?.member_id || obj?.memberId)
  @IsOptional()
  @IsString()
  memberId?: string;

  @ApiPropertyOptional({ description: 'Filter by commission type', enum: ['MEMBERSHIP', 'REPURCHASE', 'ALL'], default: 'ALL' })
  @IsOptional()
  @IsString()
  commissionType?: 'MEMBERSHIP' | 'REPURCHASE' | 'ALL' = 'ALL';

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Number of items per page', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}
