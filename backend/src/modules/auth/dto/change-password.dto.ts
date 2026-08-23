import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    example: 'CurrentP@ssw0rd!',
    description: 'Current password',
    required: false,
  })
  @IsOptional()
  @IsString()
  currentPassword?: string;

  @ApiProperty({
    description: 'Old password (alias for currentPassword)',
    required: false,
  })
  @IsOptional()
  @IsString()
  oldPassword?: string;

  @ApiProperty({
    example: 'NewP@ssw0rd123!',
    description: 'New password (minimum 6 characters)',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  newPassword!: string;
}
