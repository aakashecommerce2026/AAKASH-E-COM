import { IsOptional, IsString, IsEmail } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateMemberProfileDto {
  @ApiPropertyOptional({ description: 'Unique Username' })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({ description: 'Full Name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Email Address' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Mobile Number' })
  @IsOptional()
  @IsString()
  mobile?: string;

  @ApiPropertyOptional({ description: 'Contact Address (String or Object)' })
  @IsOptional()
  address?: any;

  @ApiPropertyOptional({ description: 'Profile Photo URL' })
  @IsOptional()
  @IsString()
  profilePhoto?: string;

  @ApiPropertyOptional({ description: 'UPI Handle ID' })
  @IsOptional()
  @IsString()
  upiId?: string;

  @ApiPropertyOptional({ description: 'Bank Details Object' })
  @IsOptional()
  bankDetails?: Record<string, any>;
}
