import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { CommissionStatus } from '@prisma/client';

export class QueryRepurchaseCommissionDto {
  @ApiPropertyOptional({ default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Filter by Repurchase Entry UUID' })
  @IsOptional()
  @IsUUID()
  repurchaseEntryId?: string;

  @ApiPropertyOptional({ description: 'Filter by Source Member UUID' })
  @IsOptional()
  @IsUUID()
  sourceMemberId?: string;

  @ApiPropertyOptional({ description: 'Filter by Beneficiary Member UUID' })
  @IsOptional()
  @IsUUID()
  beneficiaryMemberId?: string;

  @ApiPropertyOptional({ description: 'Filter by level (1-20)' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  @IsOptional()
  level?: number;

  @ApiPropertyOptional({ enum: CommissionStatus, description: 'Filter by commission status' })
  @IsOptional()
  @IsEnum(CommissionStatus)
  status?: CommissionStatus;

  @ApiPropertyOptional({ default: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ default: 'desc', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
