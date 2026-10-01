// =============================================================================
// Prisma Plugin for Fastify
// =============================================================================

import type { FastifyPluginAsync } from 'fastify';
import { prisma } from '@mino-chat/db';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: typeof prisma;
  }
}

const prismaPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorate('prisma', prisma);

  fastify.addHook('onClose', async (instance) => {
    await instance.prisma.$disconnect();
  });
};

export default prismaPlugin;
