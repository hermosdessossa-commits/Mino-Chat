// =============================================================================
// Environment Configuration with Zod Validation
// =============================================================================

import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),

  // Database (Supabase)
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url(),

  // Auth
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),
  JWT_REFRESH_EXPIRY_REMEMBER: z.string().default('30d'),

  // Redis (optional — Socket.io runs without cross-instance adapter if unset)
  REDIS_URL: z.string().url().optional(),

  // CORS
  CORS_ORIGIN: z.string().url(),

  // Storage (S3-compatible, optional — uploads disabled if unset)
  S3_ENDPOINT: z.string().url().optional(),
  S3_ACCESS_KEY: z.string().min(1).optional(),
  S3_SECRET_KEY: z.string().min(1).optional(),
  S3_BUCKET: z.string().min(1).optional(),
  S3_REGION: z.string().default('auto'),
  S3_PUBLIC_URL: z.string().url().optional(),

  // Email (Resend)
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().default('noreply@mino.chat'),
  EMAIL_REPLY_TO: z.string().email().optional(),

  // Frontend URL (for magic links)
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

export function getEnv(): Env {
  if (!cachedEnv) {
    const result = envSchema.safeParse(process.env);
    if (!result.success) {
      console.error('❌ Invalid environment variables:');
      console.error(result.error.flatten().fieldErrors);
      process.exit(1);
    }
    cachedEnv = result.data;
  }
  return cachedEnv;
}

export const env = getEnv();
