import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MemberRole, MemberStatus } from '@prisma/client';
import { MemberRank } from '../../promotions/promotions.service';
import { BankDetailsDto } from './bank-details.dto';

export class MemberResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-1234567890ab' })
  id!: string;

  @ApiProperty({ example: 'AK10001' })
  memberCode!: string;

  @ApiProperty({ example: 'John Doe' })
  name!: string;

  @ApiPropertyOptional({ example: 'johndoe' })
  username?: string | null;

  @ApiProperty({ example: '+919876543210' })
  mobile!: string;

  @ApiPropertyOptional({ example: 'john@example.com' })
  email?: string | null;

  @ApiPropertyOptional({ example: '123 Main Street' })
  address?: string | null;

  @ApiPropertyOptional({ example: 'b2c3d4e5-f6a7-8901-bcde-2345678901bc' })
  referrerId?: string | null;

  @ApiProperty({ example: '2026-08-06T12:00:00.000Z' })
  joiningDate!: Date;

  @ApiPropertyOptional({ example: 'john@upi' })
  upiId?: string | null;

  @ApiPropertyOptional({ type: BankDetailsDto })
  bankDetails?: BankDetailsDto | null;

  @ApiProperty({ enum: MemberStatus })
  status!: MemberStatus;

  @ApiProperty({ enum: MemberRole })
  role!: MemberRole;

  @ApiProperty({ enum: MemberRank, example: 'BRONZE' })
  rank!: MemberRank;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
