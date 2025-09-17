import { visarunRouteReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zGetAllVisarunRoutesTrpcInput = z
  .object({
    search: z.string().optional(),
    isActive: z.boolean().optional(),
    stamp: z.boolean().optional(),
    visa: z.boolean().optional(),
    includeStops: z.boolean().optional().default(true),
    includeTransports: z.boolean().optional().default(true),
    includePrices: z.boolean().optional().default(false),
    includeSchedules: z.boolean().optional().default(false),
  })
  .optional();

export const getAllVisarunRoutesTrpcRoute = visarunRouteReadProcedure
  .input(zGetAllVisarunRoutesTrpcInput)
  .query(async ({ input, ctx }) => {
    const search = input?.search;
    const isActive = input?.isActive;
    const stamp = input?.stamp;
    const visa = input?.visa;
    const includeStops = input?.includeStops ?? true;
    const includeTransports = input?.includeTransports ?? true;
    const includePrices = input?.includePrices ?? false;
    const includeSchedules = input?.includeSchedules ?? false;

    const routes = await ctx.prisma.visarunRoute.findMany({
      where: {
        ...(search && {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        }),
        ...(isActive !== undefined && { isActive }),
        ...(stamp !== undefined && { stamp }),
        ...(visa !== undefined && { visa }),
      },
      include: {
        routeStops: includeStops
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
        transports: includeTransports
          ? {
              include: {
                transport: {
                  include: {
                    transportType: true,
                  },
                },
              },
              where: {
                isActive: true,
              },
            }
          : false,
        prices: includePrices
          ? {
              include: {
                seatClass: true,
              },
            }
          : false,
        VisarunSchedule: includeSchedules
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
      orderBy: {
        name: 'asc',
      },
    });

    // Add summary statistics to each route
    const routesWithSummary = routes.map(route => {
      const totalStops = route.routeStops?.length || 0;
      const totalTransports = route.transports?.length || 0;
      const totalSchedules = route.VisarunSchedule?.length || 0;

      // Check for pickup locations only if stops are included
      let hasPickupLocations = false;
      if (includeStops && route.routeStops) {
        hasPickupLocations = route.routeStops.some(
          stop =>
            'pickupLocations' in stop &&
            stop.pickupLocations &&
            Array.isArray(stop.pickupLocations) &&
            stop.pickupLocations.length > 0
        );
      }

      return {
        ...route,
        summary: {
          totalStops,
          totalTransports,
          totalSchedules,
          hasPickupLocations,
          isConfigured: totalStops > 0 && totalTransports > 0,
        },
      };
    });

    return {
      routes: routesWithSummary,
    };
  });
