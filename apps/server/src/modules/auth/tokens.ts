// =============================================================================
// Auth Tokens - Cookie handling, token rotation
// =============================================================================

import type { FastifyReply } from 'fastify';
import { env } from '../../config/env';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  getTokenExpiryDate,
  hashToken,
  generateTokenId,
} from '../../utils/crypto';
import { prisma } from '@mino-chat/db';
import { UnauthorizedError, TokenInvalidError } from '../../utils/errors';

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

export const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/auth/refresh',
};

export function setAuthCookies(
  reply: FastifyReply,
  accessToken: string,
  refreshToken: string,
): void {
  const accessExpiry = getTokenExpiryDate(env.JWT_ACCESS_EXPIRY);
  const refreshExpiry = getTokenExpiryDate(env.JWT_REFRESH_EXPIRY);

  reply.setCookie('accessToken', accessToken, {
    ...COOKIE_OPTIONS,
    expires: accessExpiry,
    maxAge: Math.floor((accessExpiry.getTime() - Date.now()) / 1000),
  });

  reply.setCookie('refreshToken', refreshToken, {
    ...REFRESH_COOKIE_OPTIONS,
    expires: refreshExpiry,
    maxAge: Math.floor((refreshExpiry.getTime() - Date.now()) / 1000),
  });
}

export function clearAuthCookies(reply: FastifyReply): void {
  reply.clearCookie('accessToken', { ...COOKIE_OPTIONS, path: '/' });
  reply.clearCookie('refreshToken', { ...REFRESH_COOKIE_OPTIONS, path: '/auth/refresh' });
}

export async function rotateRefreshToken(
  userId: string,
  oldTokenId: string,
  rememberMe = false,
): Promise<{ accessToken: string; refreshToken: string; newTokenId: string }> {
  // Revoke old token
  await prisma.refreshToken.update({
    where: { id: oldTokenId },
    data: { revokedAt: new Date() },
  });

  // Create new token
  const newTokenId = generateTokenId();
  const newRefreshToken = generateRefreshToken({ sub: userId, tokenId: newTokenId }, rememberMe);
  const accessToken = generateAccessToken({ sub: userId, email: '', username: '' }); // Will be updated with actual user data

  const expiresAt = getTokenExpiryDate(
    rememberMe ? env.JWT_REFRESH_EXPIRY_REMEMBER : env.JWT_REFRESH_EXPIRY,
  );

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenId: newTokenId,
      tokenHash: hashToken(newRefreshToken),
      expiresAt,
    },
  });

  return { accessToken, refreshToken: newRefreshToken, newTokenId };
}

export async function validateAndRotateRefreshToken(
  refreshToken: string,
  rememberMe = false,
): Promise<{ accessToken: string; newRefreshToken: string; userId: string }> {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new TokenInvalidError('Invalid refresh token');
  }

  const storedToken = await prisma.refreshToken.findUnique({
    where: { tokenId: payload.tokenId },
  });

  if (!storedToken || storedToken.revokedAt || storedToken.expiresAt < new Date()) {
    throw new UnauthorizedError('Refresh token revoked or expired');
  }

  const tokenHash = hashToken(refreshToken);
  if (storedToken.tokenHash !== tokenHash) {
    // Token reuse detected - revoke all user tokens
    await prisma.refreshToken.updateMany({
      where: { userId: storedToken.userId },
      data: { revokedAt: new Date() },
    });
    throw new UnauthorizedError('Token reuse detected');
  }

  const { accessToken, refreshToken: newRefreshToken } = await rotateRefreshToken(
    storedToken.userId,
    storedToken.id,
    rememberMe,
  );

  return { accessToken, newRefreshToken, userId: storedToken.userId };
}
