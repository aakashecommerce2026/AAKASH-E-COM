import { IsOptional, IsString, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum MemberActivityCategory {
  ALL = 'ALL',
  EARNINGS = 'EARNINGS',
  REPURCHASE = 'REPURCHASE',
  DISTRIBUTION = 'DISTRIBUTION',
  SYSTEM = 'SYSTEM',
}

export class QueryMemberActivityDto {
  @ApiPropertyOptional({
    enum: MemberActivityCategory,
    default: MemberActivityCategory.ALL,
    description: 'Filter activity stream by category',
  })
  @IsOptional()
  @IsEnum(MemberActivityCategory)
  category?: MemberActivityCategory = MemberActivityCategory.ALL;

  @ApiPropertyOptional({ description: 'Start date ISO string (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date ISO string (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  endDate?: string;

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
