import { IsNotEmpty, IsString, IsOptional, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUpiDto {
  @ApiProperty({
    description: 'UPI ID / VPA handle (e.g. name@okaxis, 9876543210@upi)',
    example: 'john.doe@okaxis',
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/, {
    message: 'Invalid UPI ID format (expected handle@bank or handle@upi)',
  })
  upiId!: string;

  @ApiPropertyOptional({
    description: 'Account Holder / UPI Registered Name',
    example: 'John Doe',
  })
  @IsOptional()
  @IsString()
  upiName?: string;
}
