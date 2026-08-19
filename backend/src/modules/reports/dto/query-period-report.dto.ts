import { IsOptional, IsString, IsInt, IsEnum, IsDateString, IsBoolean, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ReportType {
  MEMBER_REGISTRATIONS = 'member-registrations',
  REPURCHASE_ACTIVITIES = 'repurchase-activities',
  EARNINGS_SUMMARY = 'earnings-summary',
  BUSINESS_SUMMARY = 'business-summary',
}

export enum PeriodTypeEnum {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

export class QueryPeriodReportDto {
  @ApiProperty({
    enum: ReportType,
    description: 'Type of report to generate (member-registrations, repurchase-activities, earnings-summary, business-summary)',
  })
  @IsEnum(ReportType)
  type!: ReportType;

  @ApiPropertyOptional({
    enum: PeriodTypeEnum,
    description: 'Periodicity bucket for reporting (daily, weekly, monthly)',
    default: PeriodTypeEnum.DAILY,
  })
  @IsOptional()
  @IsEnum(PeriodTypeEnum)
  period?: PeriodTypeEnum = PeriodTypeEnum.DAILY;

  @ApiPropertyOptional({ description: 'Filter by start date (ISO string e.g. 2026-01-01)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Filter by end date (ISO string e.g. 2026-12-31)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Run export asynchronously via Bull queue', default: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  async?: boolean = false;

  @ApiPropertyOptional({ description: 'Page number for paginated list items', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Number of items per page', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  limit?: number = 10;
}
