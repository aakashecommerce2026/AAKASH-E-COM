import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class GetHierarchyQueryDto {
  @ApiPropertyOptional({
    example: 5,
    default: 10,
    description: 'Maximum depth levels to traverse (capped at 20)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  maxLevels?: number = 10;

  @ApiPropertyOptional({
    example: true,
    default: false,
    description:
      'Whether to include the target root member itself at level 0 in downline tree output',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeSelf?: boolean;
}
