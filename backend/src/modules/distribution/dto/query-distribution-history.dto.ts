import {
  IsOptional,
  IsString,
  IsInt,
  IsDateString,
  Min,
  Max,
  IsEnum,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { DistributionBatchStatus } from '@prisma/client';

export class QueryDistributionHistoryDto {
  @ApiPropertyOptional({ description: 'Filter by start date (ISO string)' })
  @Transform(({ obj, value }) => value || obj?.start_date || obj?.startDate)
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Filter by end date (ISO string)' })
  @Transform(({ obj, value }) => value || obj?.end_date || obj?.endDate)
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    enum: DistributionBatchStatus,
    description: 'Filter by batch status',
  })
  @IsOptional()
  @IsEnum(DistributionBatchStatus)
  status?: DistributionBatchStatus;

  @ApiPropertyOptional({ description: 'Search term for batchNo or remarks' })
  @IsOptional()
  @IsString()
  search?: string;

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
