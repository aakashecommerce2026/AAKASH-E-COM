import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class ReassignReferrerDto {
  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-abcd-1234567890ab',
    description: 'UUID of the new active Referrer Member',
  })
  @IsString()
  @IsNotEmpty({ message: 'New Referrer ID is required' })
  @IsUUID('4', { message: 'New Referrer ID must be a valid UUID' })
  newReferrerId!: string;

  @ApiProperty({
    example: 'Admin realignment of downline branch',
    description: 'Reason for reassigning referrer',
  })
  @IsString()
  @IsNotEmpty({ message: 'Reason for reassignment is required' })
  reason!: string;
}
