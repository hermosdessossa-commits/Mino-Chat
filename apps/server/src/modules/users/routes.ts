// =============================================================================
// Users Routes
// =============================================================================

import type { FastifyPluginAsync } from 'fastify';
import type { SearchUsersInput } from '@mino-chat/shared';
import { prisma } from '@mino-chat/db';
import { z } from 'zod';
import { validateQuery } from '../../middleware/validation';
import { NotFoundError } from '../../utils/errors';

const searchUsersQuerySchema = z.object({
  q: z.string().min(1).max(100),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

const usersRoutes: FastifyPluginAsync = async (fastify) => {
  // Search users
  fastify.get(
    '/users/search',
    {
      schema: {
        querystring: searchUsersQuerySchema,
      },
      preHandler: [validateQuery(searchUsersQuerySchema)],
    },
    async (request, reply) => {
      const { q, limit } = request.validatedQuery as SearchUsersInput;

      const users = await prisma.user.findMany({
        where: {
          OR: [
            { username: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
          ],
          NOT: { id: request.user?.sub }, // Exclude current user
        },
        take: limit,
        select: {
          id: true,
          username: true,
          email: true,
          avatarUrl: true,
        },
        orderBy: { username: 'asc' },
      });

      reply.send(users);
    },
  );

  // Get user by ID
  fastify.get(
    '/users/:id',
    {
      schema: {
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'cuid' },
          },
          required: ['id'],
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          username: true,
          email: true,
          avatarUrl: true,
          createdAt: true,
        },
      });

      if (!user) {
        throw new NotFoundError('User');
      }

      reply.send(user);
    },
  );
};

export default usersRoutes;
