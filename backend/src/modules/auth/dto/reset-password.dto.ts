import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'member@example.com',
    description: 'Registered email address',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    example: '123456',
    description: '6-digit OTP code or reset token from email link',
  })
  @IsString()
  @IsNotEmpty()
  token!: string;

  @ApiProperty({
    example: 'NewP@ssw0rd2026',
    description: 'New password (min 8 chars with uppercase, lowercase, and number/special char)',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      'Password must contain at least 1 uppercase letter, 1 lowercase letter, and 1 number or special character',
  })
  newPassword!: string;
}
