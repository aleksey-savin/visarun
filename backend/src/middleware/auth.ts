import { TRPCError } from '@trpc/server';
import { middleware } from '../lib/trpc.ts';
import { verifyToken, TokenPayload } from '../utils/jwt.ts';

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

// Admin-only middleware
export const requireAdmin = middleware(async ({ ctx, next }) => {
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

  if (payload.role !== 'admin') {
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

// Admin or manager middleware
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

  if (payload.role !== 'admin' && payload.role !== 'manager') {
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
