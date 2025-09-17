import { pickupLocationReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zGetAllPickupLocationsTrpcInput = z
  .object({
    cityId: z.string().uuid().optional(),
    search: z.string().optional(),
    isActive: z.boolean().optional(),
    includeRouteStops: z.boolean().optional().default(true),
  })
  .optional();

export const getAllPickupLocationsTrpcRoute = pickupLocationReadProcedure
  .input(zGetAllPickupLocationsTrpcInput)
  .query(async ({ input, ctx }) => {
    const cityId = input?.cityId;
    const search = input?.search;
    const isActive = input?.isActive;
    const includeRouteStops = input?.includeRouteStops ?? true;

    const whereClause = {
      ...(cityId && { cityId }),
      ...(isActive !== undefined && { isActive }),
      ...(search && {
        OR: [
          {
            name: {
              contains: search,
              mode: 'insensitive' as const,
            },
          },
          {
            address: {
              contains: search,
              mode: 'insensitive' as const,
            },
          },
          {
            landmark: {
              contains: search,
              mode: 'insensitive' as const,
            },
          },
          {
            city: {
              name: {
                contains: search,
                mode: 'insensitive' as const,
              },
            },
          },
        ],
      }),
    };

    if (includeRouteStops) {
      const pickupLocations = await ctx.prisma.pickupLocation.findMany({
        where: whereClause,
        include: {
          city: {
            include: {
              country: true,
            },
          },
          routeStops: {
            include: {
              routeStop: {
                include: {
                  route: true,
                  city: true,
                },
              },
            },
          },
        },
        orderBy: [{ city: { name: 'asc' } }, { name: 'asc' }],
      });

      // Add summary information to each pickup location
      const pickupLocationsWithSummary = pickupLocations.map(pickupLocation => {
        const totalRouteStops = pickupLocation.routeStops.length;
        const activeRouteStops = pickupLocation.routeStops.filter(
          rs => rs.routeStop.route.isActive
        ).length;
        const uniqueRoutes = new Set(pickupLocation.routeStops.map(rs => rs.routeStop.route.id))
          .size;
        const hasCoordinates = !!pickupLocation.coordinates;
        const hasLandmark = !!pickupLocation.landmark;

        return {
          ...pickupLocation,
          summary: {
            totalRouteStops,
            activeRouteStops,
            uniqueRoutes,
            hasCoordinates,
            hasLandmark,
            isInUse: activeRouteStops > 0,
            completenessScore:
              ([
                pickupLocation.name,
                pickupLocation.address,
                pickupLocation.landmark,
                pickupLocation.coordinates,
              ].filter(Boolean).length /
                4) *
              100, // Percentage of fields filled
          },
        };
      });

      // Group by city for better organization
      const groupedByCity = pickupLocationsWithSummary.reduce(
        (acc, location) => {
          const cityId = location.city.id;
          if (!acc[cityId]) {
            acc[cityId] = {
              city: location.city,
              pickupLocations: [],
              summary: {
                totalLocations: 0,
                activeLocations: 0,
                locationsInUse: 0,
                locationsWithCoordinates: 0,
              },
            };
          }

          acc[cityId].pickupLocations.push(location);
          acc[cityId].summary.totalLocations++;

          if (location.isActive) {
            acc[cityId].summary.activeLocations++;
          }

          if (location.summary.isInUse) {
            acc[cityId].summary.locationsInUse++;
          }

          if (location.summary.hasCoordinates) {
            acc[cityId].summary.locationsWithCoordinates++;
          }

          return acc;
        },
        {} as Record<
          string,
          {
            city: (typeof pickupLocations)[0]['city'];
            pickupLocations: typeof pickupLocationsWithSummary;
            summary: {
              totalLocations: number;
              activeLocations: number;
              locationsInUse: number;
              locationsWithCoordinates: number;
            };
          }
        >
      );

      return {
        pickupLocations: pickupLocationsWithSummary,
        groupedByCity: Object.values(groupedByCity),
      };
    } else {
      const pickupLocations = await ctx.prisma.pickupLocation.findMany({
        where: whereClause,
        include: {
          city: {
            include: {
              country: true,
            },
          },
        },
        orderBy: [{ city: { name: 'asc' } }, { name: 'asc' }],
      });

      // Add summary information to each pickup location
      const pickupLocationsWithSummary = pickupLocations.map(pickupLocation => {
        const hasCoordinates = !!pickupLocation.coordinates;
        const hasLandmark = !!pickupLocation.landmark;

        return {
          ...pickupLocation,
          summary: {
            totalRouteStops: 0,
            activeRouteStops: 0,
            uniqueRoutes: 0,
            hasCoordinates,
            hasLandmark,
            isInUse: false,
            completenessScore:
              ([
                pickupLocation.name,
                pickupLocation.address,
                pickupLocation.landmark,
                pickupLocation.coordinates,
              ].filter(Boolean).length /
                4) *
              100, // Percentage of fields filled
          },
        };
      });

      // Group by city for better organization
      const groupedByCity = pickupLocationsWithSummary.reduce(
        (acc, location) => {
          const cityId = location.city.id;
          if (!acc[cityId]) {
            acc[cityId] = {
              city: location.city,
              pickupLocations: [],
              summary: {
                totalLocations: 0,
                activeLocations: 0,
                locationsInUse: 0,
                locationsWithCoordinates: 0,
              },
            };
          }

          acc[cityId].pickupLocations.push(location);
          acc[cityId].summary.totalLocations++;

          if (location.isActive) {
            acc[cityId].summary.activeLocations++;
          }

          if (location.summary.isInUse) {
            acc[cityId].summary.locationsInUse++;
          }

          if (location.summary.hasCoordinates) {
            acc[cityId].summary.locationsWithCoordinates++;
          }

          return acc;
        },
        {} as Record<
          string,
          {
            city: (typeof pickupLocations)[0]['city'];
            pickupLocations: typeof pickupLocationsWithSummary;
            summary: {
              totalLocations: number;
              activeLocations: number;
              locationsInUse: number;
              locationsWithCoordinates: number;
            };
          }
        >
      );

      return {
        pickupLocations: pickupLocationsWithSummary,
        groupedByCity: Object.values(groupedByCity),
      };
    }
  });
