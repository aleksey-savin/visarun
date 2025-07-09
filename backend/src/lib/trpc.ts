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

export const messageTemplateManageProcedure = trpc.procedure.use(
  requirePermission('messages.manage')
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

// Visa citizenship surcharge management procedures
export const visaCitizenshipSurchargeCreateProcedure = trpc.procedure.use(
  requirePermission('visaCitizenshipSurcharges.create')
);
export const visaCitizenshipSurchargeReadProcedure = trpc.procedure.use(
  requirePermission('visaCitizenshipSurcharges.read')
);
export const visaCitizenshipSurchargeUpdateProcedure = trpc.procedure.use(
  requirePermission('visaCitizenshipSurcharges.update')
);
export const visaCitizenshipSurchargeDeleteProcedure = trpc.procedure.use(
  requirePermission('visaCitizenshipSurcharges.delete')
);

// City management procedures
export const cityCreateProcedure = trpc.procedure.use(requirePermission('cities.create'));
export const cityReadProcedure = trpc.procedure.use(requirePermission('cities.read'));
export const cityUpdateProcedure = trpc.procedure.use(requirePermission('cities.update'));
export const cityDeleteProcedure = trpc.procedure.use(requirePermission('cities.delete'));

// Order management procedures
export const orderCreateProcedure = trpc.procedure.use(requirePermission('orders.create'));
export const orderReadProcedure = trpc.procedure.use(requirePermission('orders.read'));
export const orderUpdateProcedure = trpc.procedure.use(requirePermission('orders.update'));
export const orderDeleteProcedure = trpc.procedure.use(requirePermission('orders.delete'));

// OrderItem management procedures
export const orderItemCreateProcedure = trpc.procedure.use(requirePermission('orderItems.create'));
export const orderItemReadProcedure = trpc.procedure.use(requirePermission('orderItems.read'));
export const orderItemUpdateProcedure = trpc.procedure.use(requirePermission('orderItems.update'));
export const orderItemDeleteProcedure = trpc.procedure.use(requirePermission('orderItems.delete'));

// ClientDiscountRule management procedures
export const clientDiscountRuleCreateProcedure = trpc.procedure.use(
  requirePermission('clientDiscountRules.create')
);
export const clientDiscountRuleReadProcedure = trpc.procedure.use(
  requirePermission('clientDiscountRules.read')
);
export const clientDiscountRuleUpdateProcedure = trpc.procedure.use(
  requirePermission('clientDiscountRules.update')
);
export const clientDiscountRuleDeleteProcedure = trpc.procedure.use(
  requirePermission('clientDiscountRules.delete')
);

// ClientDiscountAssignment management procedures
export const clientDiscountAssignmentCreateProcedure = trpc.procedure.use(
  requirePermission('clientDiscountAssignments.create')
);
export const clientDiscountAssignmentReadProcedure = trpc.procedure.use(
  requirePermission('clientDiscountAssignments.read')
);
export const clientDiscountAssignmentUpdateProcedure = trpc.procedure.use(
  requirePermission('clientDiscountAssignments.update')
);
export const clientDiscountAssignmentDeleteProcedure = trpc.procedure.use(
  requirePermission('clientDiscountAssignments.delete')
);

// VisaType management procedures
export const visaTypeCreateProcedure = trpc.procedure.use(requirePermission('visaTypes.create'));
export const visaTypeReadProcedure = trpc.procedure.use(requirePermission('visaTypes.read'));
export const visaTypeUpdateProcedure = trpc.procedure.use(requirePermission('visaTypes.update'));
export const visaTypeDeleteProcedure = trpc.procedure.use(requirePermission('visaTypes.delete'));

// VisaApplication management procedures
export const visaApplicationCreateProcedure = trpc.procedure.use(
  requirePermission('visaApplications.create')
);
export const visaApplicationReadProcedure = trpc.procedure.use(
  requirePermission('visaApplications.read')
);
export const visaApplicationUpdateProcedure = trpc.procedure.use(
  requirePermission('visaApplications.update')
);
export const visaApplicationDeleteProcedure = trpc.procedure.use(
  requirePermission('visaApplications.delete')
);

// ClientVisa management procedures
export const clientVisaCreateProcedure = trpc.procedure.use(
  requirePermission('clientVisas.create')
);
export const clientVisaReadProcedure = trpc.procedure.use(requirePermission('clientVisas.read'));
export const clientVisaUpdateProcedure = trpc.procedure.use(
  requirePermission('clientVisas.update')
);
export const clientVisaDeleteProcedure = trpc.procedure.use(
  requirePermission('clientVisas.delete')
);

// Requirement management procedures
export const requirementCreateProcedure = trpc.procedure.use(
  requirePermission('requirements.create')
);
export const requirementReadProcedure = trpc.procedure.use(requirePermission('requirements.read'));
export const requirementUpdateProcedure = trpc.procedure.use(
  requirePermission('requirements.update')
);
export const requirementDeleteProcedure = trpc.procedure.use(
  requirePermission('requirements.delete')
);

// RequirementDocument management procedures
export const requirementDocumentCreateProcedure = trpc.procedure.use(
  requirePermission('requirementDocuments.create')
);
export const requirementDocumentReadProcedure = trpc.procedure.use(
  requirePermission('requirementDocuments.read')
);
export const requirementDocumentUpdateProcedure = trpc.procedure.use(
  requirePermission('requirementDocuments.update')
);
export const requirementDocumentDeleteProcedure = trpc.procedure.use(
  requirePermission('requirementDocuments.delete')
);

// ClientDocument management procedures
export const clientDocumentCreateProcedure = trpc.procedure.use(
  requirePermission('clientDocuments.create')
);
export const clientDocumentReadProcedure = trpc.procedure.use(
  requirePermission('clientDocuments.read')
);
export const clientDocumentUpdateProcedure = trpc.procedure.use(
  requirePermission('clientDocuments.update')
);
export const clientDocumentDeleteProcedure = trpc.procedure.use(
  requirePermission('clientDocuments.delete')
);

// ServiceRequirement management procedures
export const serviceRequirementCreateProcedure = trpc.procedure.use(
  requirePermission('serviceRequirements.create')
);
export const serviceRequirementReadProcedure = trpc.procedure.use(
  requirePermission('serviceRequirements.read')
);
export const serviceRequirementUpdateProcedure = trpc.procedure.use(
  requirePermission('serviceRequirements.update')
);
export const serviceRequirementDeleteProcedure = trpc.procedure.use(
  requirePermission('serviceRequirements.delete')
);

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
