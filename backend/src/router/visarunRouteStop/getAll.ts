import { visarunRouteStopReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zGetAllVisarunRouteStopsTrpcInput = z
  .object({
    routeId: z.string().uuid().optional(),
    cityId: z.string().uuid().optional(),
    stopType: z.enum(['departure', 'intermediate', 'arrival']).optional(),
    pickupMode: z.enum(['location', 'address']).optional(),
    search: z.string().optional(),
    includePickupLocations: z.boolean().optional().default(true),
  })
  .optional();

export const getAllVisarunRouteStopsTrpcRoute = visarunRouteStopReadProcedure
  .input(zGetAllVisarunRouteStopsTrpcInput)
  .query(async ({ input, ctx }) => {
    const routeId = input?.routeId;
    const cityId = input?.cityId;
    const stopType = input?.stopType;
    const pickupMode = input?.pickupMode;
    const search = input?.search;
    const includePickupLocations = input?.includePickupLocations ?? true;

    const routeStops = await ctx.prisma.visarunRouteStop.findMany({
      where: {
        ...(routeId && { routeId }),
        ...(cityId && { cityId }),
        ...(stopType && { stopType }),
        ...(pickupMode && { pickupMode }),
        ...(search && {
          OR: [
            {
              city: {
                name: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
            },
            {
              route: {
                name: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
            },
          ],
        }),
      },
      include: {
        route: true,
        city: true,
        pickupLocations: includePickupLocations
          ? {
              include: {
                pickupLocation: true,
              },
            }
          : false,
      },
      orderBy: [{ route: { name: 'asc' } }, { stopOrder: 'asc' }],
    });

    // Add summary information to each route stop
    const routeStopsWithSummary = routeStops.map(routeStop => {
      const pickupLocationsCount = routeStop.pickupLocations?.length || 0;
      const hasPickupLocations = pickupLocationsCount > 0;
      const hasTimings = !!(routeStop.arrivalTime || routeStop.departureTime);
      const isTerminal = routeStop.stopType === 'departure' || routeStop.stopType === 'arrival';
      const requiresPickup = routeStop.pickupMode !== 'none' && routeStop.pickupMode !== 'address';

      return {
        ...routeStop,
        summary: {
          pickupLocationsCount,
          hasPickupLocations,
          hasTimings,
          isTerminal,
          requiresPickup,
          isFullyConfigured: hasTimings && (!requiresPickup || hasPickupLocations),
          missingConfiguration: [
            ...(!hasTimings ? ['timing information'] : []),
            ...(requiresPickup && !hasPickupLocations ? ['pickup locations'] : []),
          ],
        },
      };
    });

    // Group by route for better organization
    const groupedByRoute = routeStopsWithSummary.reduce(
      (acc, stop) => {
        const routeId = stop.route.id;
        if (!acc[routeId]) {
          acc[routeId] = {
            route: stop.route,
            stops: [],
            summary: {
              totalStops: 0,
              departureStops: 0,
              arrivalStops: 0,
              intermediateStops: 0,
              stopsWithPickup: 0,
              fullyConfiguredStops: 0,
            },
          };
        }

        acc[routeId].stops.push(stop);
        acc[routeId].summary.totalStops++;

        // Update stop type counts explicitly
        if (stop.stopType === 'departure') {
          acc[routeId].summary.departureStops++;
        } else if (stop.stopType === 'arrival') {
          acc[routeId].summary.arrivalStops++;
        } else if (stop.stopType === 'intermediate') {
          acc[routeId].summary.intermediateStops++;
        }

        if (stop.summary.hasPickupLocations) {
          acc[routeId].summary.stopsWithPickup++;
        }

        if (stop.summary.isFullyConfigured) {
          acc[routeId].summary.fullyConfiguredStops++;
        }

        return acc;
      },
      {} as Record<
        string,
        {
          route: (typeof routeStops)[0]['route'];
          stops: typeof routeStopsWithSummary;
          summary: {
            totalStops: number;
            departureStops: number;
            arrivalStops: number;
            intermediateStops: number;
            stopsWithPickup: number;
            fullyConfiguredStops: number;
          };
        }
      >
    );

    return {
      routeStops: routeStopsWithSummary,
      groupedByRoute: Object.values(groupedByRoute),
    };
  });
