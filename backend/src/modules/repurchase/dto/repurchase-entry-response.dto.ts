import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RepurchaseEntryResponseDto {
  @ApiProperty({ example: 'f47ac10b-58cc-4372-a567-0e02b2c3d4e5' })
  id!: string;

  @ApiProperty({ example: 'REP-2026-00001' })
  transactionRef!: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-1234567890ab' })
  memberId!: string;

  @ApiProperty({ example: 1500.5 })
  amount!: number | string;

  @ApiProperty({ example: '2026-08-06T12:00:00.000Z' })
  transactionDate!: Date;

  @ApiPropertyOptional({ example: 'Monthly product repurchase order #1042' })
  remarks?: string | null;

  @ApiPropertyOptional({ example: 'c3d4e5f6-a7b8-9012-cdef-3456789012cd' })
  createdBy?: string | null;

  @ApiProperty({ example: '2026-08-06T12:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-08-06T12:00:00.000Z' })
  updatedAt!: Date;
}
