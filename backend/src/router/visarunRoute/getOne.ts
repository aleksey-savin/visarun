import { visarunRouteReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zGetVisarunRouteTrpcInput = z.object({
  id: z.string().uuid('Invalid route ID'),
  includeStops: z.boolean().optional().default(true),
  includeTransports: z.boolean().optional().default(true),
  includePrices: z.boolean().optional().default(true),
  includeSchedules: z.boolean().optional().default(true),
});

export const getVisarunRouteTrpcRoute = visarunRouteReadProcedure
  .input(zGetVisarunRouteTrpcInput)
  .query(async ({ input, ctx }) => {
    const route = await ctx.prisma.visarunRoute.findUnique({
      where: { id: input.id },
      include: {
        routeStops: input.includeStops
          ? {
              include: {
                city: true,
                pickupLocations: {
                  include: {
                    pickupLocation: true,
                  },
                },
              },
              orderBy: {
                stopOrder: 'asc',
              },
            }
          : false,
        transports: input.includeTransports
          ? {
              include: {
                transport: {
                  include: {
                    transportType: true,
                    seatDistribution: {
                      include: {
                        seatClass: true,
                      },
                    },
                  },
                },
              },
              where: {
                isActive: true,
              },
            }
          : false,
        prices: input.includePrices
          ? {
              include: {
                seatClass: true,
              },
            }
          : false,
        VisarunSchedule: input.includeSchedules
          ? {
              where: {
                isActive: true,
              },
              orderBy: {
                createdAt: 'desc',
              },
            }
          : false,
      },
    });

    if (!route) {
      throw new Error('Route not found');
    }

    // Add detailed summary information
    let hasPickupLocations = false;
    let stopsWithPickup = 0;

    // Check for pickup locations only if stops are included
    if (input.includeStops && route.routeStops) {
      hasPickupLocations = route.routeStops.some(
        stop =>
          'pickupLocations' in stop &&
          stop.pickupLocations &&
          Array.isArray(stop.pickupLocations) &&
          stop.pickupLocations.length > 0
      );

      stopsWithPickup = route.routeStops.filter(
        stop =>
          'pickupLocations' in stop &&
          stop.pickupLocations &&
          Array.isArray(stop.pickupLocations) &&
          stop.pickupLocations.length > 0
      ).length;
    }

    const summary = {
      totalStops: route.routeStops?.length || 0,
      totalTransports: route.transports?.length || 0,
      totalSchedules: route.VisarunSchedule?.length || 0,
      totalPriceRules: route.prices?.length || 0,
      hasPickupLocations,
      isFullyConfigured:
        (route.routeStops?.length || 0) > 0 &&
        (route.transports?.length || 0) > 0 &&
        (route.prices?.length || 0) > 0,
      stopsWithPickup,
    };

    return {
      route: {
        ...route,
        summary,
      },
    };
  });
