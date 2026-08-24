import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class LevelRateDto {
  @ApiProperty({ example: 1, description: 'Downline Level (1..20)' })
  @IsInt()
  @Min(1)
  @Max(20)
  level!: number;

  @ApiProperty({ example: 10.0, description: 'Percentage rate for this level' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  percentage!: number;

  @ApiPropertyOptional({ example: 'Level 1 Sponsor Commission' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateCommissionConfigDto {
  @ApiProperty({
    example: 2,
    description: 'Version number for rate table configuration',
  })
  @IsInt()
  @Min(1)
  version!: number;

  @ApiProperty({
    type: [LevelRateDto],
    description: 'List of rates for 20 levels',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LevelRateDto)
  rates!: LevelRateDto[];

  @ApiPropertyOptional({
    example: true,
    description: 'Set as current active version',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class MembershipCommissionConfigResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-1234567890ab' })
  id!: string;

  @ApiProperty({ example: 1 })
  version!: number;

  @ApiProperty({ example: 1 })
  level!: number;

  @ApiProperty({ example: 10.0 })
  percentage!: number | string;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiPropertyOptional({ example: 'Level 1 Sponsor Commission' })
  description?: string | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
