// =============================================================================
// Auth Module Schemas
// =============================================================================

import type { z } from 'zod';
import {
  registerSchema,
  loginSchema,
  magicLinkRequestSchema,
  magicLinkVerifySchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
} from '@mino-chat/shared';

export const registerBodySchema = registerSchema;
export const loginBodySchema = loginSchema;
export const magicLinkRequestBodySchema = magicLinkRequestSchema;
export const magicLinkVerifyQuerySchema = magicLinkVerifySchema;
export const refreshTokenBodySchema = refreshTokenSchema;
export const forgotPasswordBodySchema = forgotPasswordSchema;
export const resetPasswordBodySchema = resetPasswordSchema;
export const updateProfileBodySchema = updateProfileSchema;

export type RegisterBody = z.infer<typeof registerBodySchema>;
export type LoginBody = z.infer<typeof loginBodySchema>;
export type MagicLinkRequestBody = z.infer<typeof magicLinkRequestBodySchema>;
export type MagicLinkVerifyQuery = z.infer<typeof magicLinkVerifyQuerySchema>;
export type RefreshTokenBody = z.infer<typeof refreshTokenBodySchema>;
export type ForgotPasswordBody = z.infer<typeof forgotPasswordBodySchema>;
export type ResetPasswordBody = z.infer<typeof resetPasswordBodySchema>;
export type UpdateProfileBody = z.infer<typeof updateProfileBodySchema>;
