import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({
    example: 'member@example.com',
    description: 'Registered email address to send password reset link',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;
}
