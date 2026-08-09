import { z } from 'zod';

export const validationSchema = z.object({
  APP_ENV: z.enum(['development', 'production', 'test']).default('development'),
  APP_PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  JWT_EXPIRES_IN: z.string().default('8h'),
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),
  REDIS_KEY_PREFIX: z.string().default('content-owl:'),
  REDIS_DEFAULT_TTL_SECONDS: z.coerce.number().int().positive().default(3600),
  REDIS_QUEUE_URL: z.string().min(1, 'REDIS_QUEUE_URL is required'),
  REDIS_QUEUE_PREFIX: z.string().default('bull:'),
  ENABLE_BULL_BOARD: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:5173,http://localhost:3000')
    .transform((value) => value.split(',').map((origin) => origin.trim())),
});

export type EnvConfig = z.infer<typeof validationSchema>;

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const result = validationSchema.safeParse(config);

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    throw new Error(`Environment validation failed:\n${details}`);
  }

  return result.data;
}
