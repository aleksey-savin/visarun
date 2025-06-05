import { initTRPC } from '@trpc/server';
import * as trpcExpress from '@trpc/server/adapters/express';
import { type Express } from 'express';
import { type Request } from 'express';
import { type AppContext, createAppContext } from './ctx.js';
import { verifyToken, type TokenPayload } from '../utils/jwt.js';

export const trpc = initTRPC.context<AppContext>().create();

// Export middleware
export const middleware = trpc.middleware;
export const router = trpc.router;
export const procedure = trpc.procedure;

// Helper function to extract and verify JWT from the request
const getUserFromRequest = (req: Request): TokenPayload | undefined => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return undefined;

  const token = authHeader.split(' ')[1]; // Bearer token format
  if (!token) return undefined;

  // Use the existing verifyToken function from utils/jwt.ts
  const payload = verifyToken(token);
  return payload || undefined;
};

export const isAdmin = trpc.middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new Error('Not authenticated');
  }

  if (ctx.user.role !== 'admin') {
    throw new Error('Not authorized. Admin access required');
  }

  return next({ ctx });
});

// Create an admin procedure
export const adminProcedure = trpc.procedure.use(isAdmin);

const isTelegramBot = trpc.middleware(async ({ ctx, next }) => {
  // Get the X-Telegram-Bot-Id header from the request
  const telegramBotId = ctx.req?.headers['x-telegram-bot-id'];

  if (!telegramBotId || telegramBotId !== process.env.TELEGRAM_BOT_USERNAME) {
    throw new Error(
      `Unauthorized: Only requests from${process.env.TELEGRAM_BOT_USERNAME} are allowed`
    );
  }

  return next({ ctx });
});

export const telegramBotProcedure = trpc.procedure.use(isTelegramBot);

export const applyTrpcToExpressApp = async <TRouter extends ReturnType<typeof trpc.router>>(
  app: Express,
  router: TRouter
) => {
  app.use(
    '/trpc',
    trpcExpress.createExpressMiddleware({
      router,
      createContext: ({ req, res }) => {
        // Create base context
        const ctx = createAppContext({ req, res });

        // Add user info if authenticated
        if (req) {
          const user = getUserFromRequest(req);
          if (user) {
            ctx.user = user;
          }
        }

        return ctx;
      },
    })
  );
};
