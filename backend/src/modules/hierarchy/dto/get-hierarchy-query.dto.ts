import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

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
}
