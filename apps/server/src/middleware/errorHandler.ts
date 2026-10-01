// =============================================================================
// Global Error Handler
// =============================================================================

import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { isAppError, getErrorResponse, getErrorStatusCode } from '../utils/errors';

export async function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  request.log.error({ err: error }, 'Request error');

  // Zod validation errors
  if (error instanceof ZodError) {
    return reply.code(400).send({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: { issues: error.errors },
      },
    });
  }

  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return handlePrismaError(error, reply);
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return reply.code(400).send({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid data provided',
      },
    });
  }

  // App errors
  if (isAppError(error)) {
    return reply.code(getErrorStatusCode(error)).send({
      error: getErrorResponse(error),
    });
  }

  // Fastify validation errors
  if (error.validation) {
    return reply.code(400).send({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request',
        details: { issues: error.validation },
      },
    });
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    return reply.code(401).send({
      error: {
        code: 'TOKEN_INVALID',
        message: 'Invalid or expired token',
      },
    });
  }

  // Default internal error
  const statusCode = error.statusCode || 500;
  return reply.code(statusCode).send({
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env['NODE_ENV'] === 'development' ? error.message : 'Internal server error',
    },
  });
}

function handlePrismaError(
  error: Prisma.PrismaClientKnownRequestError,
  reply: FastifyReply,
): FastifyReply {
  switch (error.code) {
    case 'P2002': {
      const target = error.meta?.['target'] as string[] | undefined;
      const field = target?.[0] || 'field';
      return reply.code(409).send({
        error: {
          code: 'CONFLICT',
          message: `${field} already exists`,
          details: { field },
        },
      });
    }
    case 'P2025': {
      return reply.code(404).send({
        error: {
          code: 'NOT_FOUND',
          message: 'Record not found',
        },
      });
    }
    case 'P2003': {
      return reply.code(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Foreign key constraint failed',
        },
      });
    }
    default:
      return reply.code(500).send({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Database error',
        },
      });
  }
}

export function notFoundHandler(request: FastifyRequest, reply: FastifyReply): void {
  reply.code(404).send({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${request.method} ${request.url} not found`,
    },
  });
}
