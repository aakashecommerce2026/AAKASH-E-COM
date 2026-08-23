import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty } from 'class-validator';
import { OtpPurpose } from '../enums/otp-purpose.enum';

export class SendOtpDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Target email address for OTP code',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    enum: OtpPurpose,
    example: OtpPurpose.EMAIL_VERIFICATION,
    description: 'Purpose of OTP code generation',
  })
  @IsEnum(OtpPurpose)
  @IsNotEmpty()
  purpose!: OtpPurpose;
}
