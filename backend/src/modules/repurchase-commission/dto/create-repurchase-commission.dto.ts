import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CommissionStatus } from '@prisma/client';

export class CreateRepurchaseCommissionDto {
  @ApiProperty({
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d4e5',
    description: 'Repurchase Entry UUID',
  })
  @IsUUID()
  @IsNotEmpty()
  repurchaseEntryId!: string;

  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-abcd-1234567890ab',
    description: 'Source Member UUID (who made repurchase)',
  })
  @IsUUID()
  @IsNotEmpty()
  sourceMemberId!: string;

  @ApiProperty({
    example: 'b2c3d4e5-f6a7-8901-bcde-2345678901bc',
    description: 'Beneficiary Member UUID (upline who earns)',
  })
  @IsUUID()
  @IsNotEmpty()
  beneficiaryMemberId!: string;

  @ApiProperty({
    example: 1,
    description: 'Commission Downline Level (1, 2, 3...)',
  })
  @IsInt()
  @Min(1)
  level!: number;

  @ApiProperty({ example: 5.0, description: 'Commission Percentage Rate' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  percentage!: number;

  @ApiProperty({ example: 75.25, description: 'Earned Commission Amount' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount!: number;

  @ApiPropertyOptional({
    enum: CommissionStatus,
    default: CommissionStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(CommissionStatus)
  status?: CommissionStatus;
}
