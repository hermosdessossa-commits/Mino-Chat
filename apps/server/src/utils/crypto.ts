// =============================================================================
// Crypto Utilities - JWT, Password Hashing, Token Generation
// =============================================================================

import type { SignOptions, VerifyOptions } from 'jsonwebtoken';
import { sign, verify } from 'jsonwebtoken';
import { hash, compare, genSalt } from 'bcryptjs';
import { randomBytes, createHash } from 'crypto';
import { env } from '../config/env';

export interface AccessTokenPayload {
  sub: string;
  email: string;
  username: string;
  type: 'access';
}

export interface RefreshTokenPayload {
  sub: string;
  tokenId: string;
  type: 'refresh';
}

export interface MagicLinkTokenPayload {
  email: string;
  type: 'magic-link';
  nonce: string;
}

export type TokenPayload = AccessTokenPayload | RefreshTokenPayload | MagicLinkTokenPayload;

// Use loose types to avoid strict jsonwebtoken typing issues
const ACCESS_TOKEN_OPTIONS = {
  algorithm: 'HS256',
  issuer: 'mino-chat',
  audience: 'mino-chat-api',
  expiresIn: env.JWT_ACCESS_EXPIRY,
} as SignOptions;

const REFRESH_TOKEN_OPTIONS = {
  algorithm: 'HS256',
  issuer: 'mino-chat',
  audience: 'mino-chat-api',
  expiresIn: env.JWT_REFRESH_EXPIRY,
} as SignOptions;

const VERIFY_OPTIONS = {
  algorithms: ['HS256'],
  issuer: 'mino-chat',
  audience: 'mino-chat-api',
} as VerifyOptions;

export function generateAccessToken(payload: Omit<AccessTokenPayload, 'type'>): string {
  return sign({ ...payload, type: 'access' }, env.JWT_SECRET, ACCESS_TOKEN_OPTIONS);
}

export function generateRefreshToken(
  payload: Omit<RefreshTokenPayload, 'type'>,
  rememberMe = false,
): string {
  const options = rememberMe
    ? ({ ...REFRESH_TOKEN_OPTIONS, expiresIn: env.JWT_REFRESH_EXPIRY_REMEMBER } as SignOptions)
    : REFRESH_TOKEN_OPTIONS;
  return sign({ ...payload, type: 'refresh' }, env.JWT_REFRESH_SECRET, options);
}

export function generateMagicLinkToken(payload: Omit<MagicLinkTokenPayload, 'type'>): string {
  return sign({ ...payload, type: 'magic-link' }, env.JWT_SECRET, {
    algorithm: 'HS256',
    issuer: 'mino-chat',
    audience: 'mino-chat-api',
    expiresIn: '15m',
  } as SignOptions);
}

interface TokenWithType {
  type: string;
  [key: string]: unknown;
}

function isTokenWithType(decoded: unknown): decoded is TokenWithType {
  return typeof decoded === 'object' && decoded !== null && 'type' in decoded;
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = verify(token, env.JWT_SECRET, VERIFY_OPTIONS);
  if (!isTokenWithType(decoded) || decoded.type !== 'access') throw new Error('Invalid token type');
  return decoded as unknown as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const decoded = verify(token, env.JWT_REFRESH_SECRET, VERIFY_OPTIONS);
  if (!isTokenWithType(decoded) || decoded.type !== 'refresh')
    throw new Error('Invalid token type');
  return decoded as unknown as RefreshTokenPayload;
}

export function verifyMagicLinkToken(token: string): MagicLinkTokenPayload {
  const decoded = verify(token, env.JWT_SECRET, VERIFY_OPTIONS);
  if (!isTokenWithType(decoded) || decoded.type !== 'magic-link')
    throw new Error('Invalid token type');
  return decoded as unknown as MagicLinkTokenPayload;
}

export function extractTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  return parts[1] ?? null;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await genSalt(12);
  return hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return compare(password, hash);
}

export function generateSecureToken(length = 32): string {
  return randomBytes(length).toString('hex');
}

export function generateNonce(): string {
  return randomBytes(16).toString('hex');
}

export function generateTokenId(): string {
  return randomBytes(16).toString('hex');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function parseExpiry(expiry: string): number {
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match || !match[1] || !match[2]) return 0;

  const value = parseInt(match[1], 10);
  const unit = match[2] as string;

  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      return 0;
  }
}

export function getTokenExpiryDate(expiry: string): Date {
  return new Date(Date.now() + parseExpiry(expiry));
}
