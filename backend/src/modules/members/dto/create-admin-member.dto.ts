import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MemberRole, MemberStatus } from '@prisma/client';
import { BankDetailsDto } from './bank-details.dto';

export class CreateAdminMemberDto {
  @ApiPropertyOptional({
    example: 'AK10001',
    description: 'Member Code (auto-generated if omitted)',
  })
  @IsOptional()
  @IsString()
  memberCode?: string;

  @ApiProperty({ example: 'John Doe', description: 'Full name of the member' })
  @IsString()
  @IsNotEmpty({ message: 'Member name is required' })
  name!: string;

  @ApiProperty({ example: '+919876543210', description: 'Mobile phone number' })
  @IsString()
  @IsNotEmpty({ message: 'Mobile number is required' })
  @Matches(/^\+?[0-9]{10,15}$/, {
    message:
      'Mobile number must be 10 to 15 digits, optionally prefixed with +',
  })
  mobile!: string;

  @ApiPropertyOptional({
    example: 'john@example.com',
    description: 'Email address',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Invalid email format' })
  email?: string;

  @ApiPropertyOptional({
    example: '123 Main Street, City',
    description: 'Postal Address',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    example: 'a1b2c3d4-e5f6-7890-abcd-1234567890ab',
    description: 'Referrer Member UUID',
  })
  @IsOptional()
  @IsUUID('4', { message: 'Referrer ID must be a valid UUID' })
  referrerId?: string;

  @ApiPropertyOptional({ example: 'john@upi', description: 'UPI ID' })
  @IsOptional()
  @IsString()
  upiId?: string;

  @ApiPropertyOptional({
    type: BankDetailsDto,
    description: 'Bank Account Details',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => BankDetailsDto)
  bankDetails?: BankDetailsDto;

  @ApiPropertyOptional({ enum: MemberStatus, default: MemberStatus.ACTIVE })
  @IsOptional()
  @IsEnum(MemberStatus, { message: 'Invalid member status' })
  status?: MemberStatus;

  @ApiPropertyOptional({
    example: 'SecureP@ssw0rd!',
    description:
      'Plain password (auto-generated temporary password if omitted)',
  })
  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password?: string;

  @ApiPropertyOptional({ enum: MemberRole, default: MemberRole.MEMBER })
  @IsOptional()
  @IsEnum(MemberRole, { message: 'Invalid member role' })
  role?: MemberRole;
}
