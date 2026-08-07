import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MemberRole, MemberStatus } from '@prisma/client';
import { BankDetailsDto } from './bank-details.dto';

export class CreateMemberDto {
  @ApiProperty({ example: 'AK10001', description: 'Unique Member Code' })
  @IsString()
  @IsNotEmpty()
  memberCode!: string;

  @ApiProperty({ example: 'John Doe', description: 'Full name of the member' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: '+919876543210', description: 'Mobile phone number' })
  @IsString()
  @IsNotEmpty()
  mobile!: string;

  @ApiPropertyOptional({
    example: 'john@example.com',
    description: 'Email address',
  })
  @IsOptional()
  @IsEmail()
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
  @IsUUID()
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
  @IsEnum(MemberStatus)
  status?: MemberStatus;

  @ApiProperty({
    example: 'SecureP@ssw0rd!',
    description: 'Plain password to hash',
  })
  @IsString()
  @IsNotEmpty()
  password!: string;

  @ApiPropertyOptional({ enum: MemberRole, default: MemberRole.MEMBER })
  @IsOptional()
  @IsEnum(MemberRole)
  role?: MemberRole;
}
