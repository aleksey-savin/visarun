import { visarunRouteStopReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zGetVisarunRouteStopTrpcInput = z.object({
  id: z.string().uuid('Invalid route stop ID'),
  includePickupLocations: z.boolean().optional().default(true),
});

export const getVisarunRouteStopTrpcRoute = visarunRouteStopReadProcedure
  .input(zGetVisarunRouteStopTrpcInput)
  .query(async ({ input, ctx }) => {
    const routeStop = await ctx.prisma.visarunRouteStop.findUnique({
      where: { id: input.id },
      include: {
        route: {
          include: {
            routeStops: {
              select: {
                id: true,
                stopOrder: true,
                stopType: true,
                city: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
              orderBy: {
                stopOrder: 'asc',
              },
            },
          },
        },
        city: {
          include: {
            country: true,
          },
        },
        pickupLocations: input.includePickupLocations
          ? {
              include: {
                pickupLocation: true,
              },
              where: {
                pickupLocation: {
                  isActive: true,
                },
              },
            }
          : false,
      },
    });

    if (!routeStop) {
      throw new Error('Route stop not found');
    }

    // Calculate additional information
    const allStops = routeStop.route?.routeStops || [];
    const currentStopIndex = allStops.findIndex((stop: { id: string }) => stop.id === routeStop.id);
    const previousStop = currentStopIndex > 0 ? allStops[currentStopIndex - 1] : null;
    const nextStop = currentStopIndex < allStops.length - 1 ? allStops[currentStopIndex + 1] : null;

    // Check pickup locations only if they were included
    let pickupLocationsCount = 0;
    let hasPickupLocations = false;
    if (input.includePickupLocations && routeStop.pickupLocations) {
      pickupLocationsCount = routeStop.pickupLocations.length;
      hasPickupLocations = pickupLocationsCount > 0;
    }

    const hasTimings = !!(routeStop.arrivalTime || routeStop.departureTime);
    const isTerminal = routeStop.stopType === 'departure' || routeStop.stopType === 'arrival';
    const requiresPickup = routeStop.pickupMode !== 'none' && routeStop.pickupMode !== 'address';
    const isFirstStop = routeStop.stopOrder === 1;
    const isLastStop = currentStopIndex === allStops.length - 1;

    // Calculate timing information
    const timingInfo = {
      hasArrivalTime: !!routeStop.arrivalTime,
      hasDepartureTime: !!routeStop.departureTime,
      arrivalNextDay: routeStop.arrivalNextDay,
      waitingDuration: routeStop.waitingDuration,
      formattedArrival: routeStop.arrivalTime
        ? `${routeStop.arrivalTime}${routeStop.arrivalNextDay ? ' +1' : ''}`
        : null,
      formattedDeparture: routeStop.departureTime || null,
    };

    // Validation checks
    const validationIssues = [];

    if (!isFirstStop && !routeStop.arrivalTime) {
      validationIssues.push('Missing arrival time for non-first stop');
    }

    if (!isLastStop && !routeStop.departureTime) {
      validationIssues.push('Missing departure time for non-last stop');
    }

    if (requiresPickup && !hasPickupLocations) {
      validationIssues.push('Pickup locations required but none configured');
    }

    if (
      routeStop.arrivalTime &&
      routeStop.departureTime &&
      routeStop.arrivalTime > routeStop.departureTime &&
      !routeStop.arrivalNextDay
    ) {
      validationIssues.push('Departure time cannot be before arrival time on the same day');
    }

    const summary = {
      pickupLocationsCount,
      hasPickupLocations,
      hasTimings,
      isTerminal,
      requiresPickup,
      isFirstStop,
      isLastStop,
      totalStopsInRoute: allStops.length,
      stopPosition: `${routeStop.stopOrder} of ${allStops.length}`,
      isFullyConfigured:
        hasTimings && (!requiresPickup || hasPickupLocations) && validationIssues.length === 0,
      validationIssues,
      timingInfo,
      navigation: {
        previousStop: previousStop
          ? {
              id: previousStop.id,
              name: previousStop.city.name,
              stopOrder: previousStop.stopOrder,
            }
          : null,
        nextStop: nextStop
          ? {
              id: nextStop.id,
              name: nextStop.city.name,
              stopOrder: nextStop.stopOrder,
            }
          : null,
      },
    };

    return {
      routeStop: {
        ...routeStop,
        summary,
      },
    };
  });
