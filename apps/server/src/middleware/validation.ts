// =============================================================================
// Validation Middleware - Zod schema validation
// =============================================================================

import type { ZodSchema } from 'zod';
import { ZodError } from 'zod';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { ValidationError } from '../utils/errors';

declare module 'fastify' {
  interface FastifyRequest {
    validatedBody?: unknown;
    validatedQuery?: unknown;
    validatedParams?: unknown;
  }
}

function createValidator<T>(schema: ZodSchema<T>, source: 'body' | 'query' | 'params') {
  return async function (request: FastifyRequest, _reply: FastifyReply) {
    try {
      const data =
        source === 'body' ? request.body : source === 'query' ? request.query : request.params;
      (request as unknown as Record<string, unknown>)[
        `validated${source.charAt(0).toUpperCase() + source.slice(1)}`
      ] = schema.parse(data);
    } catch (err) {
      if (err instanceof ZodError) {
        throw new ValidationError(`Invalid request ${source}`, { issues: err.errors });
      }
      throw err;
    }
  };
}

export function validateBody<T>(schema: ZodSchema<T>) {
  return createValidator(schema, 'body');
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return createValidator(schema, 'query');
}

export function validateParams<T>(schema: ZodSchema<T>) {
  return createValidator(schema, 'params');
}

export function validateAll<TBody, TQuery, TParams>(schemas: {
  body?: ZodSchema<TBody>;
  query?: ZodSchema<TQuery>;
  params?: ZodSchema<TParams>;
}) {
  return async function (request: FastifyRequest, _reply: FastifyReply) {
    if (schemas.body) {
      try {
        request.validatedBody = schemas.body.parse(request.body);
      } catch (err) {
        if (err instanceof ZodError) {
          throw new ValidationError('Invalid request body', { issues: err.errors });
        }
        throw err;
      }
    }

    if (schemas.query) {
      try {
        request.validatedQuery = schemas.query.parse(request.query);
      } catch (err) {
        if (err instanceof ZodError) {
          throw new ValidationError('Invalid query parameters', { issues: err.errors });
        }
        throw err;
      }
    }

    if (schemas.params) {
      try {
        request.validatedParams = schemas.params.parse(request.params);
      } catch (err) {
        if (err instanceof ZodError) {
          throw new ValidationError('Invalid route parameters', { issues: err.errors });
        }
        throw err;
      }
    }
  };
}
