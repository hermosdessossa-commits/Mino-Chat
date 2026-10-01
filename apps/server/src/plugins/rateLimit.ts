// =============================================================================
// Rate Limit Plugin for Fastify (simplified)
// =============================================================================

import type { FastifyPluginAsync } from 'fastify';
import fastifyRateLimit from '@fastify/rate-limit';

const rateLimitPlugin: FastifyPluginAsync = async (fastify) => {
  // Global rate limit
  await fastify.register(fastifyRateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });
};

export default rateLimitPlugin;
