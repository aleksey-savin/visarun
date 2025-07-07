import { TRPCError } from '@trpc/server';
import { middleware } from '../lib/trpc.js';
import { verifyToken, type TokenPayload } from '../utils/jwt.js';
import { hasPermission } from '../utils/permissions.js';

// Extend the context with user information when authenticated
export interface AuthContext {
  user?: TokenPayload;
}

export const authMiddleware = middleware(async ({ ctx, next }) => {
  // Get the token from the request headers
  const authHeader = ctx.req?.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next({
      ctx: {
        ...ctx,
        user: undefined,
      },
    });
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);

  if (!payload) {
    return next({
      ctx: {
        ...ctx,
        user: undefined,
      },
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: payload,
    },
  });
});

// Middleware that requires the user to be authenticated
export const requireAuth = middleware(async ({ ctx, next }) => {
  const authHeader = ctx.req?.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource',
    });
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);

  if (!payload) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Invalid or expired token',
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: payload,
    },
  });
});

// Permission-based middleware factory
export const requirePermission = (permission: string) =>
  middleware(async ({ ctx, next }) => {
    const authHeader = ctx.req?.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in to access this resource',
      });
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);

    if (!payload) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired token',
      });
    }

    if (!hasPermission(payload.permissions || [], permission)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Permission required: ${permission}`,
      });
    }

    return next({
      ctx: {
        ...ctx,
        user: payload,
      },
    });
  });

// Legacy admin middleware - now uses global.fullAccess permission
export const requireAdmin = requirePermission('global.fullAccess');

// Admin or manager middleware - replaced with permission-based approach
export const requireManagerOrAdmin = middleware(async ({ ctx, next }) => {
  const authHeader = ctx.req?.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource',
    });
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);

  if (!payload) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Invalid or expired token',
    });
  }

  // Check for global full access or specific management permissions
  const hasManagerPermission =
    hasPermission(payload.permissions || [], 'global.fullAccess') ||
    hasPermission(payload.permissions || [], 'users.create') ||
    hasPermission(payload.permissions || [], 'roles.create');

  if (!hasManagerPermission) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You do not have permission to access this resource',
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: payload,
    },
  });
});
