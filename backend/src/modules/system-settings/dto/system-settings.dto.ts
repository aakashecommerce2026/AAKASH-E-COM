import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateTdsStatusDto {
  @ApiProperty({ example: true, description: 'Enable or disable TDS & Admin statutory deductions system-wide' })
  @IsBoolean()
  enabled!: boolean;
}

export class TdsStatusResponseDto {
  @ApiProperty({ example: true })
  enabled!: boolean;

  @ApiProperty({ example: 'TDS (5%) & Admin Fee (5%) deductions enabled system-wide.' })
  message!: string;
}
