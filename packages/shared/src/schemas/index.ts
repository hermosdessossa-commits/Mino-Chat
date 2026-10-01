import { z } from 'zod';

export const emailSchema = z.string().email().toLowerCase().max(254);
export const usernameSchema = z
  .string()
  .min(3)
  .max(30)
  .regex(/^[a-zA-Z0-9_-]+$/, {
    message: 'Username can only contain letters, numbers, underscores and hyphens',
  });
export const passwordSchema = z.string().min(8).max(128);
export const optionalPasswordSchema = passwordSchema.optional();

export const registerSchema = z.object({
  email: emailSchema,
  username: usernameSchema,
  password: optionalPasswordSchema,
  inviteCode: z.string().optional(),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
  rememberMe: z.boolean().default(false),
});

export const magicLinkRequestSchema = z.object({
  email: emailSchema,
  redirectTo: z.string().url().optional(),
});

export const magicLinkVerifySchema = z.object({
  token: z.string().min(1),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: passwordSchema,
});

export const updateProfileSchema = z.object({
  username: usernameSchema.optional(),
  avatarUrl: z.string().url().nullable().optional(),
});

export const conversationTypeSchema = z.enum(['DIRECT', 'GROUP']);

export const createConversationSchema = z.object({
  type: conversationTypeSchema,
  name: z.string().min(1).max(100).optional(),
  participantIds: z.array(z.string().cuid()).min(1),
  avatarUrl: z.string().url().nullable().optional(),
});

export const updateConversationSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  avatarUrl: z.string().url().nullable().optional(),
});

export const addParticipantsSchema = z.object({
  userIds: z.array(z.string().cuid()).min(1),
});

export const updateParticipantRoleSchema = z.object({
  role: z.enum(['ADMIN', 'MEMBER']),
});

export const messageTypeSchema = z.enum(['TEXT', 'IMAGE', 'FILE', 'SYSTEM']);

export const createMessageSchema = z.object({
  conversationId: z.string().cuid(),
  content: z.string().max(10000),
  type: messageTypeSchema.default('TEXT'),
  replyToId: z.string().cuid().nullable().optional(),
  attachmentIds: z.array(z.string().cuid()).optional(),
});

export const editMessageSchema = z.object({
  content: z.string().max(10000),
});

export const messageSearchSchema = z.object({
  q: z.string().min(1).max(200),
  conversationId: z.string().cuid().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
});

export const reactionSchema = z.object({
  emoji: z.string().min(1).max(8),
});

export const markReadSchema = z.object({
  messageIds: z.array(z.string().cuid()).min(1).max(100),
});

export const paginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  direction: z.enum(['before', 'after']).default('before'),
});

export const presignedUrlSchema = z.object({
  filename: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(100),
  size: z
    .number()
    .int()
    .positive()
    .max(50 * 1024 * 1024),
  conversationId: z.string().cuid().optional(),
});

export const uploadCompleteSchema = z.object({
  fileId: z.string().cuid(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  thumbnail: z.string().url().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type MagicLinkRequestInput = z.infer<typeof magicLinkRequestSchema>;
export type MagicLinkVerifyInput = z.infer<typeof magicLinkVerifySchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreateConversationInput = z.infer<typeof createConversationSchema>;
export type UpdateConversationInput = z.infer<typeof updateConversationSchema>;
export type AddParticipantsInput = z.infer<typeof addParticipantsSchema>;
export type UpdateParticipantRoleInput = z.infer<typeof updateParticipantRoleSchema>;
export type CreateMessageInput = z.infer<typeof createMessageSchema>;
export type EditMessageInput = z.infer<typeof editMessageSchema>;
export type MessageSearchInput = z.infer<typeof messageSearchSchema>;
export type ReactionInput = z.infer<typeof reactionSchema>;
export type MarkReadInput = z.infer<typeof markReadSchema>;
export type PaginationParams = z.infer<typeof paginationSchema>;
export type PresignedUrlInput = z.infer<typeof presignedUrlSchema>;
export type UploadCompleteInput = z.infer<typeof uploadCompleteSchema>;
