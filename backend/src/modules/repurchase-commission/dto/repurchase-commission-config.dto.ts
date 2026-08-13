import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class RepurchaseCommissionLevelRateDto {
  @ApiProperty({ example: 1, description: 'Upline referral level (1 to 20)' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  level!: number;

  @ApiProperty({ example: 1.5, description: 'Percentage payout rate for this level' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  percentage!: number;

  @ApiPropertyOptional({ example: 'Level 1 Repurchase Commission' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateRepurchaseCommissionConfigDto {
  @ApiProperty({
    type: [RepurchaseCommissionLevelRateDto],
    description: 'Array of exactly 20 level rates summing to 5.00%',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RepurchaseCommissionLevelRateDto)
  rates!: RepurchaseCommissionLevelRateDto[];
}

export class RepurchaseCommissionConfigResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-1234567890ab' })
  id!: string;

  @ApiProperty({ example: 1 })
  version!: number;

  @ApiProperty({ example: 1 })
  level!: number;

  @ApiProperty({ example: 1.5 })
  percentage!: number;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiPropertyOptional({ example: 'Level 1 Repurchase Commission' })
  description?: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
