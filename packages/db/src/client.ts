// =============================================================================
// Mino-Chat Prisma Client Singleton
// Simple, typed client without complex extensions
// =============================================================================

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env['NODE_ENV'] === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env['NODE_ENV'] !== 'production') globalForPrisma.prisma = prisma;

export default prisma;

// =============================================================================
// Helper functions for common queries
// =============================================================================

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export async function findUserByUsername(username: string) {
  return prisma.user.findUnique({ where: { username } });
}

export async function searchUsers(query: string, limit = 20) {
  return prisma.user.findMany({
    where: {
      OR: [
        { username: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
      ],
    },
    take: limit,
    orderBy: { username: 'asc' },
  });
}

export async function findConversationsByParticipant(userId: string) {
  return prisma.conversation.findMany({
    where: {
      participants: { some: { userId } },
    },
    include: {
      participants: { include: { user: true } },
      messages: { take: 1, orderBy: { createdAt: 'desc' } },
    },
    orderBy: { updatedAt: 'desc' },
  });
}

export async function findDirectConversation(userId1: string, userId2: string) {
  return prisma.conversation.findFirst({
    where: {
      type: 'DIRECT',
      participants: {
        every: { userId: { in: [userId1, userId2] } },
      },
    },
    include: { participants: { include: { user: true } } },
  });
}

export async function findMessagesByConversation(
  conversationId: string,
  options: { cursor?: string; limit?: number; direction?: 'before' | 'after' } = {},
) {
  const { cursor, limit = 50, direction = 'before' } = options;
  const where = { conversationId, deletedAt: null };

  if (cursor) {
    (where as Record<string, unknown>)[direction === 'before' ? 'createdAt' : 'createdAt'] = {
      [direction === 'before' ? 'lt' : 'gt']: new Date(cursor),
    };
  }

  return prisma.message.findMany({
    where,
    take: limit + 1,
    orderBy: { createdAt: direction === 'before' ? 'desc' : 'asc' },
    include: {
      sender: true,
      attachments: true,
      reactions: true,
      replyTo: { include: { sender: true } },
    },
  });
}

export async function findAttachmentsByMessage(messageId: string) {
  return prisma.attachment.findMany({
    where: { messageId },
    orderBy: { createdAt: 'asc' },
  });
}

export async function getReactionSummary(messageId: string) {
  return prisma.reaction.groupBy({
    by: ['emoji'],
    where: { messageId },
    _count: { emoji: true },
  });
}

export async function userReacted(messageId: string, userId: string, emoji: string) {
  const reaction = await prisma.reaction.findUnique({
    where: { messageId_userId_emoji: { messageId, userId, emoji } },
  });
  return !!reaction;
}

export async function searchMessagesFullText(conversationId: string, query: string, limit = 20) {
  return prisma.$queryRaw`
    SELECT m.*, u.username as sender_username, u.avatar_url as sender_avatar
    FROM messages m
    JOIN users u ON m.sender_id = u.id
    WHERE m.conversation_id = ${conversationId}
      AND m.deleted_at IS NULL
      AND m.search_vector @@ plainto_tsquery('french', ${query})
    ORDER BY ts_rank_cd(m.search_vector, plainto_tsquery('french', ${query})) DESC
    LIMIT ${limit}
  `;
}
