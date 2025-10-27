import { initTRPC } from '@trpc/server';
import * as trpcExpress from '@trpc/server/adapters/express';
import { type Express } from 'express';
import { type Request } from 'express';
import { type AppContext, createAppContext } from './ctx.js';
import { verifyToken, type TokenPayload } from '../utils/jwt.js';
import { hasPermission } from '../utils/permissions.js';
import { setCurrentUser } from '../middleware/audit.js';

export const trpc = initTRPC.context<AppContext>().create();

// Export middleware
export const middleware = trpc.middleware;
export const router = trpc.router;

// Create audit context middleware using proper tRPC middleware syntax
const auditContextMiddleware = trpc.middleware(async ({ ctx, next }) => {
  // Set the current user for audit logging
  if (ctx.user) {
    setCurrentUser(ctx.user);
  } else {
    setCurrentUser(undefined);
  }

  try {
    return await next({ ctx });
  } finally {
    // Clean up user context after request
    setCurrentUser(undefined);
  }
});

// Base procedure with audit context middleware
const baseProcedure = trpc.procedure.use(auditContextMiddleware);
export const procedure = baseProcedure;

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

// Audit management procedures
export const auditManageProcedure = baseProcedure.use(requirePermission('audit.manage'));

// Specific permission-based procedures
export const userCreateProcedure = baseProcedure.use(requirePermission('users.create'));
export const userReadProcedure = baseProcedure.use(requirePermission('users.read'));
export const userUpdateProcedure = baseProcedure.use(requirePermission('users.update'));
export const userDeleteProcedure = baseProcedure.use(requirePermission('users.delete'));

export const roleCreateProcedure = baseProcedure.use(requirePermission('roles.create'));
export const roleReadProcedure = baseProcedure.use(requirePermission('roles.read'));
export const roleUpdateProcedure = baseProcedure.use(requirePermission('roles.update'));
export const roleDeleteProcedure = baseProcedure.use(requirePermission('roles.delete'));
export const roleAssignProcedure = baseProcedure.use(requirePermission('roles.assign'));

export const exchangeRateCreateProcedure = baseProcedure.use(
  requirePermission('exchangeRates.create')
);
export const exchangeRateBroadcastProcedure = baseProcedure.use(
  requirePermission('exchangeRates.broadcast')
);

export const telegramReadProcedure = baseProcedure.use(requirePermission('telegram.channels.read'));
export const telegramManageProcedure = baseProcedure.use(
  requirePermission('telegram.channels.manage')
);

export const messageTemplateManageProcedure = baseProcedure.use(
  requirePermission('messages.manage')
);

// Legacy admin procedure - now uses global.fullAccess permission
export const adminProcedure = baseProcedure.use(requirePermission('global.fullAccess'));

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

export const telegramBotProcedure = baseProcedure.use(isTelegramBot);

// Country management procedures
export const countryCreateProcedure = baseProcedure.use(requirePermission('countries.create'));
export const countryReadProcedure = baseProcedure.use(requirePermission('countries.read'));
export const countryUpdateProcedure = baseProcedure.use(requirePermission('countries.update'));
export const countryDeleteProcedure = baseProcedure.use(requirePermission('countries.delete'));

// Citizenship management procedures
export const citizenshipCreateProcedure = baseProcedure.use(
  requirePermission('citizenships.create')
);
export const citizenshipReadProcedure = baseProcedure.use(requirePermission('citizenships.read'));
export const citizenshipUpdateProcedure = baseProcedure.use(
  requirePermission('citizenships.update')
);
export const citizenshipDeleteProcedure = baseProcedure.use(
  requirePermission('citizenships.delete')
);

// Visa citizenship surcharge management procedures
export const visaCitizenshipSurchargeCreateProcedure = baseProcedure.use(
  requirePermission('visaCitizenshipSurcharges.create')
);
export const visaCitizenshipSurchargeReadProcedure = baseProcedure.use(
  requirePermission('visaCitizenshipSurcharges.read')
);
export const visaCitizenshipSurchargeUpdateProcedure = baseProcedure.use(
  requirePermission('visaCitizenshipSurcharges.update')
);
export const visaCitizenshipSurchargeDeleteProcedure = baseProcedure.use(
  requirePermission('visaCitizenshipSurcharges.delete')
);

// City management procedures
export const cityCreateProcedure = baseProcedure.use(requirePermission('cities.create'));
export const cityReadProcedure = baseProcedure.use(requirePermission('cities.read'));
export const cityUpdateProcedure = baseProcedure.use(requirePermission('cities.update'));
export const cityDeleteProcedure = baseProcedure.use(requirePermission('cities.delete'));

// Order management procedures
export const orderCreateProcedure = baseProcedure.use(requirePermission('orders.create'));
export const orderReadProcedure = baseProcedure.use(requirePermission('orders.read'));
export const orderUpdateProcedure = baseProcedure.use(requirePermission('orders.update'));
export const orderDeleteProcedure = baseProcedure.use(requirePermission('orders.delete'));

// OrderItem management procedures
export const orderItemCreateProcedure = baseProcedure.use(requirePermission('orderItems.create'));
export const orderItemReadProcedure = baseProcedure.use(requirePermission('orderItems.read'));
export const orderItemUpdateProcedure = baseProcedure.use(requirePermission('orderItems.update'));
export const orderItemDeleteProcedure = baseProcedure.use(requirePermission('orderItems.delete'));

// ClientDiscountRule management procedures
export const clientDiscountRuleCreateProcedure = baseProcedure.use(
  requirePermission('clientDiscountRules.create')
);
export const clientDiscountRuleReadProcedure = baseProcedure.use(
  requirePermission('clientDiscountRules.read')
);
export const clientDiscountRuleUpdateProcedure = baseProcedure.use(
  requirePermission('clientDiscountRules.update')
);
export const clientDiscountRuleDeleteProcedure = baseProcedure.use(
  requirePermission('clientDiscountRules.delete')
);

// ClientDiscountAssignment management procedures
export const clientDiscountAssignmentCreateProcedure = baseProcedure.use(
  requirePermission('clientDiscountAssignments.create')
);
export const clientDiscountAssignmentReadProcedure = baseProcedure.use(
  requirePermission('clientDiscountAssignments.read')
);
export const clientDiscountAssignmentUpdateProcedure = baseProcedure.use(
  requirePermission('clientDiscountAssignments.update')
);
export const clientDiscountAssignmentDeleteProcedure = baseProcedure.use(
  requirePermission('clientDiscountAssignments.delete')
);

// VisaType management procedures
export const visaTypeCreateProcedure = baseProcedure.use(requirePermission('visaTypes.create'));
export const visaTypeReadProcedure = baseProcedure.use(requirePermission('visaTypes.read'));
export const visaTypeUpdateProcedure = baseProcedure.use(requirePermission('visaTypes.update'));
export const visaTypeDeleteProcedure = baseProcedure.use(requirePermission('visaTypes.delete'));

// VisaApplication management procedures
export const visaApplicationCreateProcedure = baseProcedure.use(
  requirePermission('visaApplications.create')
);
export const visaApplicationReadProcedure = baseProcedure.use(
  requirePermission('visaApplications.read')
);
export const visaApplicationUpdateProcedure = baseProcedure.use(
  requirePermission('visaApplications.update')
);
export const visaApplicationDeleteProcedure = baseProcedure.use(
  requirePermission('visaApplications.delete')
);

// ClientVisa management procedures
export const clientVisaCreateProcedure = baseProcedure.use(requirePermission('clientVisas.create'));
export const clientVisaReadProcedure = baseProcedure.use(requirePermission('clientVisas.read'));
export const clientVisaUpdateProcedure = baseProcedure.use(requirePermission('clientVisas.update'));
export const clientVisaDeleteProcedure = baseProcedure.use(requirePermission('clientVisas.delete'));

// Requirement management procedures
export const requirementCreateProcedure = baseProcedure.use(
  requirePermission('requirements.create')
);
export const requirementReadProcedure = baseProcedure.use(requirePermission('requirements.read'));
export const requirementUpdateProcedure = baseProcedure.use(
  requirePermission('requirements.update')
);
export const requirementDeleteProcedure = baseProcedure.use(
  requirePermission('requirements.delete')
);

// RequirementDocument management procedures
export const requirementDocumentCreateProcedure = baseProcedure.use(
  requirePermission('requirementDocuments.create')
);
export const requirementDocumentReadProcedure = baseProcedure.use(
  requirePermission('requirementDocuments.read')
);
export const requirementDocumentUpdateProcedure = baseProcedure.use(
  requirePermission('requirementDocuments.update')
);
export const requirementDocumentDeleteProcedure = baseProcedure.use(
  requirePermission('requirementDocuments.delete')
);

// ClientDocument management procedures
export const clientDocumentCreateProcedure = baseProcedure.use(
  requirePermission('clientDocuments.create')
);
export const clientDocumentReadProcedure = baseProcedure.use(
  requirePermission('clientDocuments.read')
);
export const clientDocumentUpdateProcedure = baseProcedure.use(
  requirePermission('clientDocuments.update')
);
export const clientDocumentDeleteProcedure = baseProcedure.use(
  requirePermission('clientDocuments.delete')
);

// ServiceRequirement management procedures
export const serviceRequirementCreateProcedure = baseProcedure.use(
  requirePermission('serviceRequirements.create')
);
export const serviceRequirementReadProcedure = baseProcedure.use(
  requirePermission('serviceRequirements.read')
);
export const serviceRequirementUpdateProcedure = baseProcedure.use(
  requirePermission('serviceRequirements.update')
);
export const serviceRequirementDeleteProcedure = baseProcedure.use(
  requirePermission('serviceRequirements.delete')
);

// ClientRequirement management procedures
export const clientRequirementCreateProcedure = baseProcedure.use(
  requirePermission('clientRequirements.create')
);
export const clientRequirementReadProcedure = baseProcedure.use(
  requirePermission('clientRequirements.read')
);
export const clientRequirementUpdateProcedure = baseProcedure.use(
  requirePermission('clientRequirements.update')
);
export const clientRequirementDeleteProcedure = baseProcedure.use(
  requirePermission('clientRequirements.delete')
);

// Currency management procedures
export const currencyCreateProcedure = baseProcedure.use(requirePermission('currencies.create'));
export const currencyReadProcedure = baseProcedure.use(requirePermission('currencies.read'));
export const currencyUpdateProcedure = baseProcedure.use(requirePermission('currencies.update'));
export const currencyDeleteProcedure = baseProcedure.use(requirePermission('currencies.delete'));

// OrderPayment management procedures
export const orderPaymentCreateProcedure = baseProcedure.use(
  requirePermission('orderPayments.create')
);
export const orderPaymentReadProcedure = baseProcedure.use(requirePermission('orderPayments.read'));
export const orderPaymentUpdateProcedure = baseProcedure.use(
  requirePermission('orderPayments.update')
);
export const orderPaymentDeleteProcedure = baseProcedure.use(
  requirePermission('orderPayments.delete')
);

// OrderPayment accept payments procedure
export const orderPaymentAcceptProcedure = baseProcedure.use(
  requirePermission('orderPayments.canAcceptPayments')
);

// OrderPayment confirm without document procedure
export const orderPaymentConfirmWithoutDocumentProcedure = baseProcedure.use(
  requirePermission('orderPayments.confirmWithoutDocument')
);

// TransportType management procedures
export const transportTypeCreateProcedure = baseProcedure.use(
  requirePermission('transportTypes.create')
);
export const transportTypeReadProcedure = baseProcedure.use(
  requirePermission('transportTypes.read')
);
export const transportTypeUpdateProcedure = baseProcedure.use(
  requirePermission('transportTypes.update')
);
export const transportTypeDeleteProcedure = baseProcedure.use(
  requirePermission('transportTypes.delete')
);

// Transport management procedures
export const transportCreateProcedure = baseProcedure.use(requirePermission('transports.create'));
export const transportReadProcedure = baseProcedure.use(requirePermission('transports.read'));
export const transportUpdateProcedure = baseProcedure.use(requirePermission('transports.update'));
export const transportDeleteProcedure = baseProcedure.use(requirePermission('transports.delete'));

// SeatClass management procedures
export const seatClassCreateProcedure = baseProcedure.use(requirePermission('seatClasses.create'));
export const seatClassReadProcedure = baseProcedure.use(requirePermission('seatClasses.read'));
export const seatClassUpdateProcedure = baseProcedure.use(requirePermission('seatClasses.update'));
export const seatClassDeleteProcedure = baseProcedure.use(requirePermission('seatClasses.delete'));

// TransportSeatDistribution management procedures
export const transportSeatDistributionCreateProcedure = baseProcedure.use(
  requirePermission('transportSeatDistributions.create')
);
export const transportSeatDistributionReadProcedure = baseProcedure.use(
  requirePermission('transportSeatDistributions.read')
);
export const transportSeatDistributionUpdateProcedure = baseProcedure.use(
  requirePermission('transportSeatDistributions.update')
);
export const transportSeatDistributionDeleteProcedure = baseProcedure.use(
  requirePermission('transportSeatDistributions.delete')
);

// VisarunRoute management procedures
export const visarunRouteCreateProcedure = baseProcedure.use(
  requirePermission('visarunRoutes.create')
);
export const visarunRouteReadProcedure = baseProcedure.use(requirePermission('visarunRoutes.read'));
export const visarunRouteUpdateProcedure = baseProcedure.use(
  requirePermission('visarunRoutes.update')
);
export const visarunRouteDeleteProcedure = baseProcedure.use(
  requirePermission('visarunRoutes.delete')
);

// VisarunRouteTransport management procedures
export const visarunRouteTransportCreateProcedure = baseProcedure.use(
  requirePermission('visarunRouteTransports.create')
);
export const visarunRouteTransportReadProcedure = baseProcedure.use(
  requirePermission('visarunRouteTransports.read')
);
export const visarunRouteTransportUpdateProcedure = baseProcedure.use(
  requirePermission('visarunRouteTransports.update')
);
export const visarunRouteTransportDeleteProcedure = baseProcedure.use(
  requirePermission('visarunRouteTransports.delete')
);

// VisarunRouteStop management procedures
export const visarunRouteStopCreateProcedure = baseProcedure.use(
  requirePermission('visarunRouteStops.create')
);
export const visarunRouteStopReadProcedure = baseProcedure.use(
  requirePermission('visarunRouteStops.read')
);
export const visarunRouteStopUpdateProcedure = baseProcedure.use(
  requirePermission('visarunRouteStops.update')
);
export const visarunRouteStopDeleteProcedure = baseProcedure.use(
  requirePermission('visarunRouteStops.delete')
);

// PickupLocation management procedures
export const pickupLocationCreateProcedure = baseProcedure.use(
  requirePermission('pickupLocations.create')
);
export const pickupLocationReadProcedure = baseProcedure.use(
  requirePermission('pickupLocations.read')
);
export const pickupLocationUpdateProcedure = baseProcedure.use(
  requirePermission('pickupLocations.update')
);
export const pickupLocationDeleteProcedure = baseProcedure.use(
  requirePermission('pickupLocations.delete')
);

// VisarunSchedule management procedures
export const visarunScheduleCreateProcedure = baseProcedure.use(
  requirePermission('visarunSchedules.create')
);
export const visarunScheduleReadProcedure = baseProcedure.use(
  requirePermission('visarunSchedules.read')
);
export const visarunScheduleUpdateProcedure = baseProcedure.use(
  requirePermission('visarunSchedules.update')
);
export const visarunScheduleDeleteProcedure = baseProcedure.use(
  requirePermission('visarunSchedules.delete')
);

// VisarunSeatPrice management procedures
export const visarunSeatPriceCreateProcedure = baseProcedure.use(
  requirePermission('visarunSeatPrices.create')
);
export const visarunSeatPriceReadProcedure = baseProcedure.use(
  requirePermission('visarunSeatPrices.read')
);
export const visarunSeatPriceUpdateProcedure = baseProcedure.use(
  requirePermission('visarunSeatPrices.update')
);
export const visarunSeatPriceDeleteProcedure = baseProcedure.use(
  requirePermission('visarunSeatPrices.delete')
);

// VisarunTrip management procedures
export const visarunTripCreateProcedure = baseProcedure.use(
  requirePermission('visarunTrips.create')
);
export const visarunTripReadProcedure = baseProcedure.use(requirePermission('visarunTrips.read'));
export const visarunTripUpdateProcedure = baseProcedure.use(
  requirePermission('visarunTrips.update')
);
export const visarunTripDeleteProcedure = baseProcedure.use(
  requirePermission('visarunTrips.delete')
);

// VisarunPassenger management procedures
export const visarunPassengerCreateProcedure = baseProcedure.use(
  requirePermission('visarunPassengers.create')
);
export const visarunPassengerReadProcedure = baseProcedure.use(
  requirePermission('visarunPassengers.read')
);
export const visarunPassengerUpdateProcedure = baseProcedure.use(
  requirePermission('visarunPassengers.update')
);
export const visarunPassengerDeleteProcedure = baseProcedure.use(
  requirePermission('visarunPassengers.delete')
);

// VisarunTripTransport management procedures
export const visarunTripTransportCreateProcedure = baseProcedure.use(
  requirePermission('visarunTrips.create')
);
export const visarunTripTransportReadProcedure = baseProcedure.use(
  requirePermission('visarunTrips.read')
);
export const visarunTripTransportUpdateProcedure = baseProcedure.use(
  requirePermission('visarunTrips.update')
);
export const visarunTripTransportDeleteProcedure = baseProcedure.use(
  requirePermission('visarunTrips.delete')
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
