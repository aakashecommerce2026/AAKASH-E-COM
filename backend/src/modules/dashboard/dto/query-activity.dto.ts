import { IsOptional, IsString, IsInt, IsEnum, IsDateString, Min, Max, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum ActivityCategory {
  ALL = 'ALL',
  MEMBER_REGISTRATION = 'MEMBER_REGISTRATION',
  REPURCHASE = 'REPURCHASE',
  DISTRIBUTION = 'DISTRIBUTION',
  SYSTEM_ACTIVITY = 'SYSTEM_ACTIVITY',
}

export class QueryActivityDto {
  @ApiPropertyOptional({
    enum: ActivityCategory,
    description: 'Filter by activity category',
    default: ActivityCategory.ALL,
  })
  @IsOptional()
  @IsEnum(ActivityCategory)
  type?: ActivityCategory = ActivityCategory.ALL;

  @ApiPropertyOptional({ description: 'Filter by start date (ISO string)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Filter by end date (ISO string)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

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

  @ApiPropertyOptional({
    description: 'Bypass cache and force real-time calculation',
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true || value === '1' || value === 1)
  @IsBoolean()
  refresh?: boolean = false;
}
