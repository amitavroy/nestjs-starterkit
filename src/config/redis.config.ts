import { registerAs } from '@nestjs/config';

export default registerAs('redis', () => ({
  url: process.env.REDIS_URL,
  keyPrefix: process.env.REDIS_KEY_PREFIX ?? 'content-owl:',
  defaultTtlSeconds: parseInt(process.env.REDIS_DEFAULT_TTL_SECONDS ?? '3600', 10),
}));
