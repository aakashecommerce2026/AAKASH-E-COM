import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { MemberRole, MemberStatus } from '@prisma/client';

export class QueryMembersDto {
  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({
    example: 'John',
    description: 'Search string matching name, mobile, email, or memberCode',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: MemberStatus })
  @IsOptional()
  @Transform(({ value }: { value: any }) => (typeof value === 'string' ? value.toUpperCase() : value))
  @IsEnum(MemberStatus)
  status?: MemberStatus;

  @ApiPropertyOptional({ enum: MemberRole })
  @IsOptional()
  @Transform(({ value }: { value: any }) => (typeof value === 'string' ? value.toUpperCase() : value))
  @IsEnum(MemberRole)
  role?: MemberRole;

  @ApiPropertyOptional({ example: 'createdAt', default: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    example: 'desc',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
