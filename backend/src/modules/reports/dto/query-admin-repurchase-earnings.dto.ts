import { IsOptional, IsString, IsInt, IsDateString, Min, Max, IsEnum } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CommissionStatus } from '@prisma/client';

export class QueryAdminRepurchaseEarningsDto {
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

  @ApiPropertyOptional({ description: 'Filter by general member ID (matches source or beneficiary)' })
  @Transform(({ obj, value }) => value || obj?.member_id || obj?.memberId)
  @IsOptional()
  @IsString()
  memberId?: string;

  @ApiPropertyOptional({ description: 'Filter by beneficiary member ID (earner)' })
  @Transform(({ obj, value }) => value || obj?.beneficiary_member_id || obj?.beneficiaryMemberId)
  @IsOptional()
  @IsString()
  beneficiaryMemberId?: string;

  @ApiPropertyOptional({ description: 'Filter by source member ID (purchaser)' })
  @Transform(({ obj, value }) => value || obj?.source_member_id || obj?.sourceMemberId)
  @IsOptional()
  @IsString()
  sourceMemberId?: string;

  @ApiPropertyOptional({ description: 'Filter by level (1 to 20)' })
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

  @ApiPropertyOptional({ description: 'Sort field', default: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ description: 'Sort direction', enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
