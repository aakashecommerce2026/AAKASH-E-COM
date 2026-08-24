import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SearchDownlineQueryDto {
  @ApiProperty({
    example: 'John',
    description:
      'Search string to filter downline members by name, memberCode, mobile, or email',
  })
  @IsString()
  @IsNotEmpty()
  q!: string;

  @ApiPropertyOptional({
    example: 20,
    default: 20,
    description: 'Maximum depth levels to traverse (capped at 20)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  maxLevels?: number = 20;
}
