// =============================================================================
// Magic Link Authentication
// =============================================================================

import { prisma } from '@mino-chat/db';
import { generateMagicLinkToken, verifyMagicLinkToken, generateNonce } from '../../utils/crypto';
import { env } from '../../config/env';
import { MagicLinkExpiredError, MagicLinkUsedError } from '../../utils/errors';

export interface MagicLinkData {
  email: string;
  redirectTo?: string;
}

export async function createMagicLink(data: MagicLinkData): Promise<string> {
  const nonce = generateNonce();
  const token = generateMagicLinkToken({ email: data.email, nonce });

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  await prisma.magicLinkToken.create({
    data: {
      email: data.email,
      tokenHash: hashToken(token),
      nonce,
      expiresAt,
    },
  });

  const baseUrl = data.redirectTo || env.FRONTEND_URL;
  const magicLink = `${baseUrl}/auth/callback?token=${token}`;

  return magicLink;
}

export async function verifyMagicLink(token: string): Promise<{ email: string }> {
  let payload;
  try {
    payload = verifyMagicLinkToken(token);
  } catch {
    throw new MagicLinkExpiredError();
  }

  const storedToken = await prisma.magicLinkToken.findUnique({
    where: { tokenHash: hashToken(token) },
  });

  if (!storedToken) {
    throw new MagicLinkExpiredError('Magic link not found');
  }

  if (storedToken.usedAt) {
    throw new MagicLinkUsedError();
  }

  if (storedToken.expiresAt < new Date()) {
    throw new MagicLinkExpiredError();
  }

  // Mark as used
  await prisma.magicLinkToken.update({
    where: { id: storedToken.id },
    data: { usedAt: new Date() },
  });

  return { email: payload.email };
}

export async function sendMagicLinkEmail(email: string, magicLink: string): Promise<void> {
  // TODO: Integrate with Resend/nodemailer
  console.log(`📧 Magic link for ${email}: ${magicLink}`);

  // Example with nodemailer:
  // await transporter.sendMail({
  //   from: env.EMAIL_FROM,
  //   to: email,
  //   subject: 'Sign in to Mino-Chat',
  //   html: `
  //     <h1>Sign in to Mino-Chat</h1>
  //     <p>Click the link below to sign in:</p>
  //     <a href="${magicLink}">${magicLink}</a>
  //     <p>This link expires in 15 minutes.</p>
  //   `,
  // });
}

import { createHash } from 'crypto';

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function checkMagicLinkRateLimit(email: string): Promise<boolean> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const count = await prisma.magicLinkToken.count({
    where: {
      email,
      createdAt: { gte: oneHourAgo },
    },
  });

  return count < 3; // Max 3 per hour
}
