import { IsOptional, IsString, IsInt, IsEnum, IsDateString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CommissionStatus } from '@prisma/client';

export class QueryMemberEarningsDto {
  @ApiPropertyOptional({ description: 'Filter by start date (ISO string e.g. 2026-01-01)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Filter by end date (ISO string e.g. 2026-12-31)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Filter by level (1 to 20)', minimum: 1, maximum: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  level?: number;

  @ApiPropertyOptional({ enum: CommissionStatus, description: 'Filter by commission status' })
  @IsOptional()
  @IsEnum(CommissionStatus)
  status?: CommissionStatus;

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
