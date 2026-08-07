import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class BankDetailsDto {
  @ApiProperty({ example: 'John Doe', description: 'Account Holder Name' })
  @IsString()
  @IsNotEmpty()
  accountName!: string;

  @ApiProperty({
    example: '98765432101234',
    description: 'Bank Account Number',
  })
  @IsString()
  @IsNotEmpty()
  accountNumber!: string;

  @ApiProperty({ example: 'SBIN0001234', description: 'Bank IFSC Code' })
  @IsString()
  @IsNotEmpty()
  ifscCode!: string;

  @ApiProperty({ example: 'State Bank of India', description: 'Bank Name' })
  @IsString()
  @IsNotEmpty()
  bankName!: string;

  @ApiPropertyOptional({
    example: 'Chennai Main Branch',
    description: 'Bank Branch Name',
  })
  @IsOptional()
  @IsString()
  branchName?: string;
}
