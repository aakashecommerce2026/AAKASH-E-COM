import { IsOptional, IsString, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CommissionStatus } from '@prisma/client';

export enum EarningsTimeRange {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

export class QueryMemberEarningsBreakdownDto {
  @ApiPropertyOptional({
    enum: EarningsTimeRange,
    default: EarningsTimeRange.DAILY,
    description:
      'Time-series aggregation range grouping (daily, weekly, or monthly)',
  })
  @IsOptional()
  @IsEnum(EarningsTimeRange)
  range?: EarningsTimeRange = EarningsTimeRange.DAILY;

  @ApiPropertyOptional({ description: 'Start date ISO string (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date ISO string (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({
    enum: CommissionStatus,
    description: 'Filter by commission status',
  })
  @IsOptional()
  @IsEnum(CommissionStatus)
  status?: CommissionStatus;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}
