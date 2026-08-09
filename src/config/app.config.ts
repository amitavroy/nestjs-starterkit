import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  env: process.env.APP_ENV ?? 'development',
  port: parseInt(process.env.APP_PORT ?? '3000', 10),
}));
