import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateMemberDto } from './create-member.dto';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateMemberDto extends PartialType(CreateMemberDto) {
  @ApiPropertyOptional({
    example: 'NewP@ssw0rd123!',
    description: 'Optional new plain password (minimum 6 characters)',
  })
  @IsOptional()
  @IsString()
  @MinLength(6)
  override password?: string;
}
