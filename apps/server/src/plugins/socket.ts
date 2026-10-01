// =============================================================================
// Socket.io Plugin for Fastify with Redis Adapter
// =============================================================================

import type { FastifyPluginAsync } from 'fastify';
import { Server as SocketIOServer } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import { env } from '../config/env';
import { verifyAccessToken } from '../utils/crypto';

declare module 'fastify' {
  interface FastifyInstance {
    io: SocketIOServer;
  }
}

const socketPlugin: FastifyPluginAsync = async (fastify) => {
  // Redis clients for adapter
  const pubClient = new Redis(env.REDIS_URL);
  const subClient = new Redis(env.REDIS_URL);

  pubClient.on('error', (err: Error) => fastify.log.error({ err }, 'Redis pub client error'));
  subClient.on('error', (err: Error) => fastify.log.error({ err }, 'Redis sub client error'));

  await pubClient.connect();
  await subClient.connect();

  // Initialize Socket.io
  const io = new SocketIOServer(fastify.server, {
    cors: {
      origin: env.CORS_ORIGIN,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    adapter: createAdapter(pubClient, subClient),
  });

  // Authentication middleware for Socket.io
  io.use(async (socket, next) => {
    try {
      const token =
        (socket.handshake.auth['token'] as string) || (socket.handshake.query['token'] as string);

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const payload = verifyAccessToken(token);
      socket.data.user = payload;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  // Connection handling
  io.on('connection', (socket) => {
    const userId = socket.data.user.sub;

    // Join user room for direct notifications
    socket.join(`user:${userId}`);

    // Track online status
    fastify.log.info({ userId, socketId: socket.id }, 'Socket connected');

    socket.on('join-conversation', (conversationId: string) => {
      socket.join(`conversation:${conversationId}`);
      fastify.log.debug({ userId, conversationId }, 'Joined conversation');
    });

    socket.on('leave-conversation', (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
      fastify.log.debug({ userId, conversationId }, 'Left conversation');
    });

    socket.on('typing-start', (conversationId: string) => {
      socket.to(`conversation:${conversationId}`).emit('typing:start', {
        conversationId,
        userId,
        username: socket.data.user.username,
      });
    });

    socket.on('typing-stop', (conversationId: string) => {
      socket.to(`conversation:${conversationId}`).emit('typing:stop', {
        conversationId,
        userId,
      });
    });

    socket.on('disconnect', () => {
      fastify.log.info({ userId, socketId: socket.id }, 'Socket disconnected');
    });
  });

  fastify.decorate('io', io);

  fastify.addHook('onClose', async () => {
    await io.close();
    await pubClient.quit();
    await subClient.quit();
  });
};

export default socketPlugin;
