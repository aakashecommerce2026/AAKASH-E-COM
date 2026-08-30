import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class FreezeCommissionDto {
  @ApiProperty({
    example: true,
    description: 'Set true to freeze commission payouts, or false to unfreeze',
  })
  @IsBoolean()
  isFrozen!: boolean;

  @ApiPropertyOptional({
    example: 'Profile incomplete - missing bank details and address',
    description: 'Optional reason for freezing or unfreezing commission',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
