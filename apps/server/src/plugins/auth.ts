// =============================================================================
// Auth Plugin for Fastify - JWT Verification
// =============================================================================

import type { FastifyPluginAsync } from 'fastify';
import { verifyAccessToken, extractTokenFromHeader } from '../utils/crypto';

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      sub: string;
      email: string;
      username: string;
    };
  }
}

const authPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorateRequest('user', null);

  fastify.addHook('preHandler', async (request, reply) => {
    // Skip auth for public routes
    const publicPaths = [
      '/health',
      '/auth/register',
      '/auth/login',
      '/auth/magic-link/request',
      '/auth/magic-link/verify',
      '/auth/refresh',
      '/auth/forgot-password',
      '/auth/reset-password',
    ];

    if (publicPaths.some((p) => request.url.startsWith(p))) {
      return;
    }

    // Skip auth for WebSocket upgrade
    if (request.url.startsWith('/socket.io')) {
      return;
    }

    const authHeader = request.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return reply.code(401).send({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    try {
      const payload = verifyAccessToken(token);
      request.user = {
        sub: payload.sub,
        email: payload.email,
        username: payload.username,
      };
    } catch (err) {
      return reply.code(401).send({
        error: {
          code: 'TOKEN_INVALID',
          message: 'Invalid or expired token',
        },
      });
    }
  });
};

export default authPlugin;
