import { ApiProperty } from '@nestjs/swagger';

export class AuthUserDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-1234567890ab' })
  id!: string;

  @ApiProperty({ example: 'AK10001' })
  memberCode!: string;

  @ApiProperty({ example: 'John Doe' })
  name!: string;

  @ApiProperty({ example: 'johndoe', nullable: true })
  username?: string | null;

  @ApiProperty({ example: 'john@example.com', nullable: true })
  email!: string | null;

  @ApiProperty({ example: '+919876543210' })
  mobile!: string;

  @ApiProperty({ example: '123 Main Street, City', nullable: true })
  address?: string | null;

  @ApiProperty({
    example: '/uploads/profile-photos/avatar.jpg',
    nullable: true,
  })
  profilePhoto?: string | null;

  @ApiProperty({ example: 'MEMBER' })
  role!: string;

  @ApiProperty({ example: 'ACTIVE' })
  status!: string;

  @ApiProperty({ example: 'BRONZE' })
  rank?: string;
}

export class AuthResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT Access Token (15m expiry)',
  })
  accessToken!: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT Refresh Token (7d expiry)',
  })
  refreshToken!: string;

  @ApiProperty({ type: AuthUserDto })
  user!: AuthUserDto;
}
