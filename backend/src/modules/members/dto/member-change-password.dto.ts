import { IsNotEmpty, IsOptional, IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MemberChangePasswordDto {
  @ApiProperty({ description: 'Current password', required: false })
  @IsOptional()
  @IsString()
  currentPassword?: string;

  @ApiProperty({ description: 'Old password (alias for currentPassword)', required: false })
  @IsOptional()
  @IsString()
  oldPassword?: string;

  @ApiProperty({
    description:
      'New password (min 8 characters, at least 1 uppercase letter, 1 lowercase letter, and 1 number or special character)',
    example: 'NewSecureP@ss2026',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      'Password must contain at least 1 uppercase letter, 1 lowercase letter, and 1 number or special character',
  })
  newPassword!: string;
}
