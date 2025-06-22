import { initTRPC } from '@trpc/server';
import * as trpcExpress from '@trpc/server/adapters/express';
import { type Express } from 'express';
import { type Request } from 'express';
import { type AppContext, createAppContext } from './ctx.js';
import { verifyToken, type TokenPayload } from '../utils/jwt.js';
import { hasPermission } from '../utils/permissions.js';

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

// Permission-based middleware factory
export const requirePermission = (permission: string) =>
  trpc.middleware(async ({ ctx, next }) => {
    if (!ctx.user) {
      throw new Error('Not authenticated');
    }

    if (!hasPermission(ctx.user.permissions || [], permission)) {
      throw new Error(`Permission required: ${permission}`);
    }

    return next({ ctx });
  });

// Convenience middleware for common permissions
export const requireUserManagement = requirePermission('users.create');
export const requireRoleManagement = requirePermission('roles.create');
export const requireExchangeRateManagement = requirePermission('exchangeRates.create');
export const requireTelegramManagement = requirePermission('telegram.channels.manage');

// Specific permission-based procedures
export const userCreateProcedure = trpc.procedure.use(requirePermission('users.create'));
export const userReadProcedure = trpc.procedure.use(requirePermission('users.read'));
export const userUpdateProcedure = trpc.procedure.use(requirePermission('users.update'));
export const userDeleteProcedure = trpc.procedure.use(requirePermission('users.delete'));

export const roleCreateProcedure = trpc.procedure.use(requirePermission('roles.create'));
export const roleReadProcedure = trpc.procedure.use(requirePermission('roles.read'));
export const roleUpdateProcedure = trpc.procedure.use(requirePermission('roles.update'));
export const roleDeleteProcedure = trpc.procedure.use(requirePermission('roles.delete'));
export const roleAssignProcedure = trpc.procedure.use(requirePermission('roles.assign'));

export const exchangeRateCreateProcedure = trpc.procedure.use(
  requirePermission('exchangeRates.create')
);
export const exchangeRateBroadcastProcedure = trpc.procedure.use(
  requirePermission('exchangeRates.broadcast')
);

export const telegramReadProcedure = trpc.procedure.use(
  requirePermission('telegram.channels.read')
);
export const telegramManageProcedure = trpc.procedure.use(
  requirePermission('telegram.channels.manage')
);

// Legacy admin procedure - now uses global.fullAccess permission
export const adminProcedure = trpc.procedure.use(requirePermission('global.fullAccess'));

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

// Country management procedures
export const countryCreateProcedure = trpc.procedure.use(requirePermission('countries.create'));
export const countryReadProcedure = trpc.procedure.use(requirePermission('countries.read'));
export const countryUpdateProcedure = trpc.procedure.use(requirePermission('countries.update'));
export const countryDeleteProcedure = trpc.procedure.use(requirePermission('countries.delete'));

// Citizenship management procedures
export const citizenshipCreateProcedure = trpc.procedure.use(
  requirePermission('citizenships.create')
);
export const citizenshipReadProcedure = trpc.procedure.use(requirePermission('citizenships.read'));
export const citizenshipUpdateProcedure = trpc.procedure.use(
  requirePermission('citizenships.update')
);
export const citizenshipDeleteProcedure = trpc.procedure.use(
  requirePermission('citizenships.delete')
);

// Visa nationality surcharge management procedures
export const visaNationalitySurchargeCreateProcedure = trpc.procedure.use(
  requirePermission('visaNationalitySurcharge.create')
);
export const visaNationalitySurchargeReadProcedure = trpc.procedure.use(
  requirePermission('visaNationalitySurcharge.read')
);
export const visaNationalitySurchargeUpdateProcedure = trpc.procedure.use(
  requirePermission('visaNationalitySurcharge.update')
);
export const visaNationalitySurchargeDeleteProcedure = trpc.procedure.use(
  requirePermission('visaNationalitySurcharge.delete')
);

// City management procedures
export const cityCreateProcedure = trpc.procedure.use(requirePermission('cities.create'));
export const cityReadProcedure = trpc.procedure.use(requirePermission('cities.read'));
export const cityUpdateProcedure = trpc.procedure.use(requirePermission('cities.update'));
export const cityDeleteProcedure = trpc.procedure.use(requirePermission('cities.delete'));

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
