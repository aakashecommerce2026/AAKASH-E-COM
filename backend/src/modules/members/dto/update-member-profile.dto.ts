import { IsOptional, IsString, IsEmail, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateMemberProfileDto {
  @ApiPropertyOptional({ description: 'Full Name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Email Address' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Mobile Number (+91 format)' })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'Mobile number must be a valid E.164 phone number string',
  })
  mobile?: string;

  @ApiPropertyOptional({ description: 'Contact Address (String or Object)' })
  @IsOptional()
  address?: any;

  @ApiPropertyOptional({ description: 'Bank Details Object' })
  @IsOptional()
  bankDetails?: Record<string, any>;
}
