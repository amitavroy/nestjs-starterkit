import { registerAs } from '@nestjs/config';

export default registerAs('cors', () => ({
  origins: (process.env.CORS_ORIGINS ?? 'http://localhost:5173,http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim()),
}));
