// =============================================================================
// Auth Routes
// =============================================================================

import type { FastifyPluginAsync, FastifyReply } from 'fastify';
import {
  registerBodySchema,
  loginBodySchema,
  magicLinkRequestBodySchema,
  magicLinkVerifyQuerySchema,
  refreshTokenBodySchema,
  updateProfileBodySchema,
  type RegisterBody,
  type LoginBody,
  type MagicLinkRequestBody,
  type MagicLinkVerifyQuery,
  type RefreshTokenBody,
  type UpdateProfileBody,
} from './schemas';
import {
  register,
  login,
  requestMagicLink,
  verifyMagicLinkAndLogin,
  refreshAccessToken,
  logout,
  getMe,
  updateProfile,
  forgotPassword,
  resetPassword,
} from './service';
import { validateBody, validateQuery } from '../../middleware/validation';
import { UnauthorizedError } from '../../utils/errors';
import { verifyRefreshToken } from '../../utils/crypto';

const authRoutes: FastifyPluginAsync = async (fastify) => {
  // Register
  fastify.post(
    '/register',
    {
      preHandler: [validateBody(registerBodySchema)],
    },
    async (request, reply) => {
      const result = await register(request.validatedBody as RegisterBody);
      reply.code(201).send(result);
    },
  );

  // Login
  fastify.post(
    '/login',
    {
      preHandler: [validateBody(loginBodySchema)],
    },
    async (request, reply) => {
      const result = await login(request.validatedBody as LoginBody, reply);
      reply.send(result);
    },
  );

  // Magic Link - Request
  fastify.post(
    '/magic-link/request',
    {
      preHandler: [validateBody(magicLinkRequestBodySchema)],
    },
    async (request, reply) => {
      const { email, redirectTo } = request.validatedBody as MagicLinkRequestBody;
      await requestMagicLink(email, redirectTo);
      reply.send({ message: 'Magic link sent' });
    },
  );

  // Magic Link - Verify
  fastify.get(
    '/magic-link/verify',
    {
      preHandler: [validateQuery(magicLinkVerifyQuerySchema)],
    },
    async (request, reply) => {
      const { token } = request.validatedQuery as MagicLinkVerifyQuery;
      const result = await verifyMagicLinkAndLogin(token, reply);
      reply.send(result);
    },
  );

  // Refresh Token
  fastify.post(
    '/refresh',
    {
      preHandler: [validateBody(refreshTokenBodySchema)],
    },
    async (request, reply) => {
      const { refreshToken } = request.validatedBody as RefreshTokenBody;
      const rememberMe = (request.cookies as Record<string, string>)?.['rememberMe'] === 'true';
      const result = await refreshAccessToken(refreshToken, rememberMe, reply);
      reply.send(result);
    },
  );

  // Logout
  fastify.post('/logout', async (request, reply) => {
    if (!request.user) {
      throw new UnauthorizedError();
    }

    // Get token ID from refresh token
    const refreshToken = (request.cookies as Record<string, string>)?.['refreshToken'];
    if (refreshToken) {
      try {
        const payload = verifyRefreshToken(refreshToken);
        await logout(request.user.sub, payload.tokenId, reply);
      } catch {
        clearAuthCookies(reply);
      }
    } else {
      clearAuthCookies(reply);
    }

    reply.send({ message: 'Logged out' });
  });

  // Get current user
  fastify.get('/me', async (request, reply) => {
    if (!request.user) {
      throw new UnauthorizedError();
    }

    const user = await getMe(request.user.sub);
    reply.send(user);
  });

  // Update profile
  fastify.patch(
    '/me',
    {
      preHandler: [validateBody(updateProfileBodySchema)],
    },
    async (request, reply) => {
      if (!request.user) {
        throw new UnauthorizedError();
      }

      const user = await updateProfile(
        request.user.sub,
        request.validatedBody as UpdateProfileBody,
      );
      reply.send(user);
    },
  );

  // Forgot Password
  fastify.post(
    '/forgot-password',
    {
      schema: {
        body: {
          type: 'object',
          properties: {
            email: { type: 'string', format: 'email' },
          },
          required: ['email'],
        },
      },
    },
    async (request, reply) => {
      const { email } = request.body as { email: string };
      await forgotPassword(email);
      reply.send({ message: 'If the email exists, a reset link has been sent' });
    },
  );

  // Reset Password
  fastify.post(
    '/reset-password',
    {
      schema: {
        body: {
          type: 'object',
          properties: {
            token: { type: 'string' },
            password: { type: 'string', minLength: 8 },
          },
          required: ['token', 'password'],
        },
      },
    },
    async (request, reply) => {
      const { token, password } = request.body as { token: string; password: string };
      await resetPassword(token, password);
      reply.send({ message: 'Password reset successful' });
    },
  );
};

function clearAuthCookies(reply: FastifyReply) {
  reply.clearCookie('accessToken', { path: '/' });
  reply.clearCookie('refreshToken', { path: '/auth/refresh' });
}

export default authRoutes;
