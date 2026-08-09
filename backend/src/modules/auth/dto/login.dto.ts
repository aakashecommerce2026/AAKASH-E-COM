import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'AK10001',
    description: 'Member Code, Email address, or Mobile number',
  })
  @IsString()
  @IsNotEmpty()
  identifier!: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'Account password',
  })
  @IsString()
  @IsNotEmpty()
  password!: string;
}
