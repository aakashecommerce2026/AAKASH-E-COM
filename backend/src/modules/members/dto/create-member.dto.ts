import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MemberRole, MemberStatus } from '@prisma/client';
import { BankDetailsDto } from './bank-details.dto';

export class CreateMemberDto {
  @ApiProperty({ example: 'AK10001', description: 'Unique Member Code' })
  @IsString()
  @IsNotEmpty({ message: 'Member code is required' })
  memberCode!: string;

  @ApiProperty({ example: 'John Doe', description: 'Full name of the member' })
  @IsString()
  @IsNotEmpty({ message: 'Member name is required' })
  name!: string;

  @ApiPropertyOptional({ example: 'johndoe', description: 'Unique Username' })
  @IsOptional()
  @IsString()
  username?: string;

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

  @ApiProperty({
    example: 'SecureP@ssw0rd!',
    description: 'Plain password to hash (minimum 6 characters)',
  })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password!: string;

  @ApiPropertyOptional({ enum: MemberRole, default: MemberRole.MEMBER })
  @IsOptional()
  @IsEnum(MemberRole, { message: 'Invalid member role' })
  role?: MemberRole;

  @ApiPropertyOptional({
    example: '123456',
    description: '6-digit email OTP verification code',
  })
  @IsOptional()
  @IsString()
  otp?: string;

  @ApiPropertyOptional({
    example: 5000,
    description: 'Joining Fee / Package Amount (defaults to 5000)',
  })
  @IsOptional()
  @IsNumber({}, { message: 'Joining fee must be a number' })
  @Min(0, { message: 'Joining fee cannot be negative' })
  @Type(() => Number)
  joiningFee?: number;
}
