import { IsOptional, IsString, IsEnum, IsDateString, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReportType } from './query-period-report.dto';

export type ExportPeriodType = 'daily' | 'weekly' | 'monthly';

export class QueryExportReportDto {
  @ApiProperty({
    enum: ReportType,
    description: 'Type of report to export (member-registrations, repurchase-activities, earnings-summary, business-summary)',
  })
  @IsEnum(ReportType)
  type!: ReportType;

  @ApiPropertyOptional({
    description: 'Periodicity of report (daily, weekly, monthly)',
    default: 'daily',
  })
  @IsOptional()
  @IsString()
  period?: ExportPeriodType = 'daily';

  @ApiPropertyOptional({ description: 'Start date (ISO string e.g. 2026-01-01)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date (ISO string e.g. 2026-12-31)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'If true, processes export asynchronously via Bull queue', default: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  async?: boolean = false;
}
