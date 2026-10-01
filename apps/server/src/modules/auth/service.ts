// =============================================================================
// Auth Service - Business Logic
// =============================================================================

import { prisma } from '@mino-chat/db';
import { hashPassword, verifyPassword } from './password';
import {
  createMagicLink,
  verifyMagicLink,
  sendMagicLinkEmail,
  checkMagicLinkRateLimit,
} from './magicLink';
import { generateAccessToken, generateRefreshToken, getTokenExpiryDate } from '../../utils/crypto';
import { setAuthCookies, clearAuthCookies, validateAndRotateRefreshToken } from './tokens';
import type { FastifyReply } from 'fastify';
import {
  UnauthorizedError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from '../../utils/errors';
import { env } from '../../config/env';

export interface RegisterInput {
  email: string;
  username: string;
  password?: string;
}

export interface LoginInput {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthResult {
  user: {
    id: string;
    email: string;
    username: string;
    avatarUrl: string | null;
  };
  accessToken: string;
  refreshToken: string;
}

export async function register(input: RegisterInput): Promise<AuthResult> {
  const { email, username, password } = input;

  // Check if user exists
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { username }],
    },
  });

  if (existingUser) {
    if (existingUser.email === email) {
      throw new ConflictError('Email already registered');
    }
    throw new ConflictError('Username already taken');
  }

  // Hash password if provided
  const passwordHash = password
    ? await hashPassword(password)
    : await hashPassword(generateSecurePassword());

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      username,
      passwordHash,
    },
  });

  // Generate tokens
  const tokenId = generateTokenId();
  const accessToken = generateAccessToken({
    sub: user.id,
    email: user.email,
    username: user.username,
  });

  const refreshToken = generateRefreshToken(
    {
      sub: user.id,
      tokenId,
    },
    false,
  );

  // Store refresh token
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenId,
      tokenHash: hashToken(refreshToken),
      expiresAt: getTokenExpiryDate(env.JWT_REFRESH_EXPIRY),
    },
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      avatarUrl: user.avatarUrl ?? null,
    },
    accessToken,
    refreshToken,
  };
}

export async function login(input: LoginInput, reply: FastifyReply): Promise<AuthResult> {
  const { email, password, rememberMe = false } = input;

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new UnauthorizedError('Invalid credentials');
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    throw new UnauthorizedError('Invalid credentials');
  }

  const tokenId = generateTokenId();
  const accessToken = generateAccessToken({
    sub: user.id,
    email: user.email,
    username: user.username,
  });

  const refreshToken = generateRefreshToken({ sub: user.id, tokenId }, rememberMe);

  const expiresAt = getTokenExpiryDate(
    rememberMe ? env.JWT_REFRESH_EXPIRY_REMEMBER : env.JWT_REFRESH_EXPIRY,
  );

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenId,
      tokenHash: hashToken(refreshToken),
      expiresAt,
    },
  });

  setAuthCookies(reply, accessToken, refreshToken);

  return {
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      avatarUrl: user.avatarUrl,
    },
    accessToken,
    refreshToken,
  };
}

export async function requestMagicLink(email: string, redirectTo?: string): Promise<void> {
  const canRequest = await checkMagicLinkRateLimit(email);
  if (!canRequest) {
    throw new ValidationError('Too many magic link requests. Please try again later.');
  }

  const magicLink = await createMagicLink({ email, redirectTo });
  await sendMagicLinkEmail(email, magicLink);
}

export async function verifyMagicLinkAndLogin(
  token: string,
  reply: FastifyReply,
): Promise<AuthResult> {
  const { email } = await verifyMagicLink(token);

  let user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    // Auto-create user from magic link
    const username = email.split('@')[0];
    const baseUsername = username;
    let finalUsername = baseUsername;
    let counter = 1;

    while (await prisma.user.findUnique({ where: { username: finalUsername } })) {
      finalUsername = `${baseUsername}${counter}`;
      counter++;
    }

    user = await prisma.user.create({
      data: {
        email,
        username: finalUsername as string,
        passwordHash: await hashPassword(generateSecurePassword()),
        emailVerified: true,
      },
    });
  }

  const tokenId = generateTokenId();
  const accessToken = generateAccessToken({
    sub: user.id,
    email: user.email,
    username: user.username,
  });

  const refreshToken = generateRefreshToken({ sub: user.id, tokenId }, false);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenId,
      tokenHash: hashToken(refreshToken),
      expiresAt: getTokenExpiryDate(env.JWT_REFRESH_EXPIRY),
    },
  });

  setAuthCookies(reply, accessToken, refreshToken);

  return {
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      avatarUrl: user.avatarUrl ?? null,
    },
    accessToken,
    refreshToken,
  };
}

export async function refreshAccessToken(
  refreshToken: string,
  rememberMe: boolean,
  reply: FastifyReply,
): Promise<{ accessToken: string; refreshToken: string }> {
  const { accessToken, newRefreshToken } = await validateAndRotateRefreshToken(
    refreshToken,
    rememberMe,
  );

  setAuthCookies(reply, accessToken, newRefreshToken);

  return { accessToken, refreshToken: newRefreshToken };
}

export async function logout(userId: string, tokenId: string, reply: FastifyReply): Promise<void> {
  await prisma.refreshToken.update({
    where: { id: tokenId },
    data: { revokedAt: new Date() },
  });

  clearAuthCookies(reply);
}

export async function logoutAllDevices(userId: string, reply: FastifyReply): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { userId },
    data: { revokedAt: new Date() },
  });

  clearAuthCookies(reply);
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      username: true,
      avatarUrl: true,
      role: true,
      emailVerified: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new NotFoundError('User');
  }

  return user;
}

export async function updateProfile(
  userId: string,
  data: { username?: string; avatarUrl?: string | null },
) {
  if (data.username) {
    const existing = await prisma.user.findUnique({
      where: { username: data.username },
    });
    if (existing && existing.id !== userId) {
      throw new ConflictError('Username already taken');
    }
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      email: true,
      username: true,
      avatarUrl: true,
      role: true,
      emailVerified: true,
      createdAt: true,
    },
  });

  return user;
}

export async function forgotPassword(email: string): Promise<void> {
  // Always return success to prevent email enumeration
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return;

  // TODO: Implement password reset token generation and email
  console.log(`🔐 Password reset requested for ${email}`);
}

export async function resetPassword(_token: string, _password: string): Promise<void> {
  // TODO: Implement password reset token verification
  throw new Error('Not implemented');
}

function generateSecurePassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 32; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

import { randomBytes, createHash } from 'crypto';

function generateTokenId(): string {
  return randomBytes(16).toString('hex');
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
