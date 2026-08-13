import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class CreateRepurchaseEntryDto {
  @ApiProperty({
    example: 'REP-2026-00001',
    description: 'Unique Transaction Reference Code',
  })
  @Transform(({ obj, value }) => value || obj.transaction_ref)
  @IsString()
  @IsNotEmpty()
  transactionRef!: string;

  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-abcd-1234567890ab',
    description: 'Member UUID',
  })
  @Transform(({ obj, value }) => value || obj.member_id)
  @IsUUID()
  @IsNotEmpty()
  memberId!: string;

  @ApiProperty({ example: 1500.5, description: 'Repurchase Purchase Amount (must be > 0)' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount!: number;

  @ApiPropertyOptional({
    example: '2026-08-06T12:00:00.000Z',
    description: 'Transaction Date',
  })
  @Transform(({ obj, value }) => value || obj.transaction_date)
  @IsOptional()
  @IsDateString()
  transactionDate?: string;

  @ApiPropertyOptional({
    example: 'Monthly product repurchase order #1042',
    description: 'Optional transaction notes or remarks',
  })
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiPropertyOptional({
    example: 'c3d4e5f6-a7b8-9012-cdef-3456789012cd',
    description: 'User/Admin UUID who recorded entry',
  })
  @IsOptional()
  @IsUUID()
  createdBy?: string;
}
