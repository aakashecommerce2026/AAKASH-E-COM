import { IsOptional, IsString, IsInt, IsEnum, IsDateString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CommissionStatus } from '@prisma/client';

export class QueryMemberWiseEarningsDto {
  @ApiPropertyOptional({ description: 'Filter by start date (ISO string)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Filter by end date (ISO string)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ enum: CommissionStatus, description: 'Filter by commission status' })
  @IsOptional()
  @IsEnum(CommissionStatus)
  status?: CommissionStatus;

  @ApiPropertyOptional({ description: 'Search member by name, code, mobile, or email' })
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
