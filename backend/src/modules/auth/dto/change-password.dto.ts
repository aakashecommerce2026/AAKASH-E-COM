import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    example: 'CurrentP@ssw0rd!',
    description: 'Current password',
  })
  @IsString()
  @IsNotEmpty()
  currentPassword!: string;

  @ApiProperty({
    example: 'NewP@ssw0rd123!',
    description: 'New password (minimum 6 characters)',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  newPassword!: string;
}
