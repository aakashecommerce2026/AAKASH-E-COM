import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum NetworkGrowthGroupBy {
  WEEK = 'week',
  MONTH = 'month',
}

export class NetworkGrowthQueryDto {
  @ApiPropertyOptional({
    enum: NetworkGrowthGroupBy,
    default: NetworkGrowthGroupBy.MONTH,
    description: 'Time bucket period for grouping growth statistics (week or month)',
  })
  @IsOptional()
  @IsEnum(NetworkGrowthGroupBy)
  groupBy?: NetworkGrowthGroupBy = NetworkGrowthGroupBy.MONTH;

  @ApiPropertyOptional({
    example: 20,
    default: 20,
    description: 'Maximum depth levels to traverse (capped at 20)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  maxLevels?: number = 20;

  @ApiPropertyOptional({
    example: '2026-01-01T00:00:00.000Z',
    description: 'Optional start date filter (ISO string)',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    example: '2026-12-31T23:59:59.999Z',
    description: 'Optional end date filter (ISO string)',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
