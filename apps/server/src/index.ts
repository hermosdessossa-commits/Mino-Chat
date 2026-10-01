// =============================================================================
// Mino-Chat Server Entry Point
// =============================================================================

import type { FastifyInstance } from 'fastify';
import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Plugins
import prismaPlugin from './plugins/prisma';
import s3Plugin from './plugins/s3';
import socketPlugin from './plugins/socket';
import authPlugin from './plugins/auth';
import rateLimitPlugin from './plugins/rateLimit';

// Routes
import authRoutes from './modules/auth/routes';
import usersRoutes from './modules/users/routes';

async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === 'development' ? 'debug' : 'info',
      transport:
        env.NODE_ENV === 'development'
          ? {
              target: 'pino-pretty',
              options: { colorize: true, translateTime: 'HH:MM:ss Z' },
            }
          : undefined,
    },
    ajv: {
      customOptions: { coerceTypes: 'array' },
    },
  });

  // Security plugins
  await app.register(helmet, {
    contentSecurityPolicy: false, // Disable for API
  });

  await app.register(cors, {
    origin: env.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  await app.register(cookie, {
    secret: env.JWT_SECRET,
    parseOptions: {},
  });

  // Rate limiting
  await app.register(rateLimitPlugin);

  // Core plugins
  await app.register(prismaPlugin);
  await app.register(s3Plugin);
  await app.register(socketPlugin);
  await app.register(authPlugin);

  // Health check (public)
  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  // API Routes
  await app.register(authRoutes, { prefix: '/auth' });
  await app.register(usersRoutes, { prefix: '/api' });

  // Error handling
  app.setErrorHandler(errorHandler);
  app.setNotFoundHandler(notFoundHandler);

  return app;
}

async function start() {
  try {
    const app = await buildApp();

    await app.listen({ port: env.PORT, host: '0.0.0.0' });

    console.log(`🚀 Server running on http://localhost:${env.PORT}`);
    console.log(`📡 WebSocket server ready`);
    console.log(`🌍 Environment: ${env.NODE_ENV}`);
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  process.exit(0);
});

start();
