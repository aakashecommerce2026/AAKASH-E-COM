import { IsOptional, IsString, IsInt, IsDateString, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryRepurchaseEntryDto {
  @ApiPropertyOptional({ description: 'Filter by member ID or member code' })
  @Transform(({ obj, value }) => value || obj?.member_id || obj?.memberId)
  @IsOptional()
  @IsString()
  memberId?: string;

  @ApiPropertyOptional({ description: 'Search term for transactionRef, member code, or member name' })
  @Transform(({ obj, value }) => value || obj?.transaction_ref || obj?.search)
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by start date (ISO string e.g. 2026-01-01)' })
  @Transform(({ obj, value }) => value || obj?.start_date || obj?.startDate)
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Filter by end date (ISO string e.g. 2026-12-31)' })
  @Transform(({ obj, value }) => value || obj?.end_date || obj?.endDate)
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

  @ApiPropertyOptional({ description: 'Sort field', default: 'transactionDate' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'transactionDate';

  @ApiPropertyOptional({ description: 'Sort direction', enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
