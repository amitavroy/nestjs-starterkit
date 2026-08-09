import { registerAs } from '@nestjs/config';

export default registerAs('queue', () => ({
  url: process.env.REDIS_QUEUE_URL,
  prefix: process.env.REDIS_QUEUE_PREFIX ?? 'bull:',
  enableBullBoard: process.env.ENABLE_BULL_BOARD === 'true',
}));
