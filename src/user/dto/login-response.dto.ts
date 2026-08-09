import { ApiProperty } from '@nestjs/swagger';

export class LoginResponseDto {
  @ApiProperty({ type: String, description: 'JWT bearer token', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  token: string;

  @ApiProperty({ type: String, description: 'User ID', example: '01JABC1234567890ABCDEFGH' })
  id: string;

  @ApiProperty({ type: String, description: 'Email address', example: 'jane@example.com' })
  email: string;
}
