import { registerAs } from '@nestjs/config';

export default registerAs('logging', () => ({
  level: process.env.LOG_LEVEL ?? 'info',
  toFile: process.env.LOG_TO_FILE === 'true',
  filePath: process.env.LOG_FILE_PATH ?? './logs',
  fileLevel: process.env.LOG_FILE_LEVEL ?? process.env.LOG_LEVEL ?? 'info',
}));
