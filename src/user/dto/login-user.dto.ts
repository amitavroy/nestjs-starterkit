import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

export class LoginUserDto {
  @ApiProperty({ type: String, description: 'Email address', example: 'jane@example.com' })
  email: string;

  @ApiProperty({ type: String, description: 'Password', example: 'SecurePass123!', format: 'password' })
  password: string;
}

export const LoginUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginUserInput = z.infer<typeof LoginUserSchema>;
