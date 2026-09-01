import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CommissionStatus } from '@prisma/client';

export class QueryMembershipCommissionDto {
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
  @Max(10000)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Filter by Source Member ID (registered member)',
  })
  @IsOptional()
  @IsUUID()
  sourceMemberId?: string;

  @ApiPropertyOptional({
    description: 'Filter by Beneficiary Member ID (earning member)',
  })
  @IsOptional()
  @IsUUID()
  beneficiaryMemberId?: string;

  @ApiPropertyOptional({ description: 'Filter by Level (1..20)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  level?: number;

  @ApiPropertyOptional({
    enum: CommissionStatus,
    description: 'Filter by Commission Status',
  })
  @IsOptional()
  @IsEnum(CommissionStatus)
  status?: CommissionStatus;

  @ApiPropertyOptional({
    example: 'createdAt',
    description: 'Sort field: createdAt, amount, level',
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ example: 'desc', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
