import { IsOptional, IsDateString, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryDashboardDto {
  @ApiPropertyOptional({
    description: 'Filter by start date (ISO string e.g. 2026-01-01)',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by end date (ISO string e.g. 2026-12-31)',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Bypass cache and force real-time calculation',
    default: false,
  })
  @IsOptional()
  @Transform(
    ({ value }) =>
      value === 'true' || value === true || value === '1' || value === 1,
  )
  @IsBoolean()
  refresh?: boolean = false;
}
