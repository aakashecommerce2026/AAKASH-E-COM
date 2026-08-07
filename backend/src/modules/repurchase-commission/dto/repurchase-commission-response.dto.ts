import { ApiProperty } from '@nestjs/swagger';
import { CommissionStatus } from '@prisma/client';

export class RepurchaseCommissionResponseDto {
  @ApiProperty({ example: 'f47ac10b-58cc-4372-a567-0e02b2c3d4e5' })
  id!: string;

  @ApiProperty({ example: 'c1d2e3f4-a5b6-7890-bcde-1234567890ab' })
  repurchaseEntryId!: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-1234567890ab' })
  sourceMemberId!: string;

  @ApiProperty({ example: 'b2c3d4e5-f6a7-8901-bcde-2345678901bc' })
  beneficiaryMemberId!: string;

  @ApiProperty({ example: 1 })
  level!: number;

  @ApiProperty({ example: 5.0 })
  percentage!: number | string;

  @ApiProperty({ example: 75.25 })
  amount!: number | string;

  @ApiProperty({ enum: CommissionStatus })
  status!: CommissionStatus;

  @ApiProperty({ example: '2026-08-06T12:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-08-06T12:00:00.000Z' })
  updatedAt!: Date;
}
