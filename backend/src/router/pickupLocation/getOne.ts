import { pickupLocationReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zGetPickupLocationTrpcInput = z.object({
  id: z.string().uuid('Invalid pickup location ID'),
  includeRouteStops: z.boolean().optional().default(true),
});

export const getPickupLocationTrpcRoute = pickupLocationReadProcedure
  .input(zGetPickupLocationTrpcInput)
  .query(async ({ input, ctx }) => {
    if (input.includeRouteStops) {
      const pickupLocation = await ctx.prisma.pickupLocation.findUnique({
        where: { id: input.id },
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
                  route: {
                    include: {
                      VisarunSchedule: {
                        where: {
                          isActive: true,
                        },
                        select: {
                          id: true,
                          name: true,
                          departureTime: true,
                          validFrom: true,
                          validTo: true,
                        },
                      },
                    },
                  },
                  city: true,
                },
              },
            },
          },
        },
      });

      if (!pickupLocation) {
        throw new Error('Pickup location not found');
      }

      // Calculate detailed summary information
      const totalRouteStops = pickupLocation.routeStops.length;
      const activeRouteStops = pickupLocation.routeStops.filter(
        rs => rs.routeStop.route.isActive
      ).length;

      const uniqueRoutes = new Set(pickupLocation.routeStops.map(rs => rs.routeStop.route.id));
      const uniqueActiveRoutes = new Set(
        pickupLocation.routeStops
          .filter(rs => rs.routeStop.route.isActive)
          .map(rs => rs.routeStop.route.id)
      );

      const routesWithSchedules = pickupLocation.routeStops.filter(
        rs => rs.routeStop.route.VisarunSchedule && rs.routeStop.route.VisarunSchedule.length > 0
      ).length;

      // Parse coordinates if available
      let parsedCoordinates = null;
      if (pickupLocation.coordinates) {
        const [lat, lng] = pickupLocation.coordinates
          .split(',')
          .map(coord => parseFloat(coord.trim()));
        if (!isNaN(lat) && !isNaN(lng)) {
          parsedCoordinates = { latitude: lat, longitude: lng };
        }
      }

      // Calculate completeness score
      const completenessFields = [
        pickupLocation.name,
        pickupLocation.address,
        pickupLocation.landmark,
        pickupLocation.coordinates,
      ];
      const filledFields = completenessFields.filter(Boolean).length;
      const completenessScore = (filledFields / completenessFields.length) * 100;

      // Group route stops by route for better organization
      const routeStopsByRoute = pickupLocation.routeStops.reduce(
        (acc, rs) => {
          const routeId = rs.routeStop.route.id;
          if (!acc[routeId]) {
            acc[routeId] = {
              route: rs.routeStop.route,
              stops: [],
            };
          }
          acc[routeId].stops.push(rs.routeStop);
          return acc;
        },
        {} as Record<
          string,
          {
            route: (typeof pickupLocation.routeStops)[0]['routeStop']['route'];
            stops: (typeof pickupLocation.routeStops)[0]['routeStop'][];
          }
        >
      );

      const summary = {
        totalRouteStops,
        activeRouteStops,
        uniqueRoutesCount: uniqueRoutes.size,
        uniqueActiveRoutesCount: uniqueActiveRoutes.size,
        routesWithSchedules,
        hasCoordinates: !!pickupLocation.coordinates,
        hasLandmark: !!pickupLocation.landmark,
        isInUse: activeRouteStops > 0,
        completenessScore,
        parsedCoordinates,
        routeStopsByRoute: Object.values(routeStopsByRoute),
        usage: {
          totalConnectedRoutes: uniqueRoutes.size,
          activeConnectedRoutes: uniqueActiveRoutes.size,
          scheduledRoutes: routesWithSchedules,
          isOperational: activeRouteStops > 0 && routesWithSchedules > 0,
        },
        validation: {
          hasRequiredFields: !!(pickupLocation.name && pickupLocation.address),
          hasOptionalEnhancements: !!(pickupLocation.landmark || pickupLocation.coordinates),
          coordinatesFormat: pickupLocation.coordinates
            ? /^-?\d+\.?\d*,-?\d+\.?\d*$/.test(pickupLocation.coordinates)
            : null,
          issues: [
            ...(!pickupLocation.name ? ['Missing name'] : []),
            ...(!pickupLocation.address ? ['Missing address'] : []),
            ...(pickupLocation.coordinates &&
            !/^-?\d+\.?\d*,-?\d+\.?\d*$/.test(pickupLocation.coordinates)
              ? ['Invalid coordinates format']
              : []),
          ],
        },
      };

      return {
        pickupLocation: {
          ...pickupLocation,
          summary,
        },
      };
    } else {
      const pickupLocation = await ctx.prisma.pickupLocation.findUnique({
        where: { id: input.id },
        include: {
          city: {
            include: {
              country: true,
            },
          },
        },
      });

      if (!pickupLocation) {
        throw new Error('Pickup location not found');
      }

      // Parse coordinates if available
      let parsedCoordinates = null;
      if (pickupLocation.coordinates) {
        const [lat, lng] = pickupLocation.coordinates
          .split(',')
          .map(coord => parseFloat(coord.trim()));
        if (!isNaN(lat) && !isNaN(lng)) {
          parsedCoordinates = { latitude: lat, longitude: lng };
        }
      }

      // Calculate completeness score
      const completenessFields = [
        pickupLocation.name,
        pickupLocation.address,
        pickupLocation.landmark,
        pickupLocation.coordinates,
      ];
      const filledFields = completenessFields.filter(Boolean).length;
      const completenessScore = (filledFields / completenessFields.length) * 100;

      const summary = {
        totalRouteStops: 0,
        activeRouteStops: 0,
        uniqueRoutesCount: 0,
        uniqueActiveRoutesCount: 0,
        routesWithSchedules: 0,
        hasCoordinates: !!pickupLocation.coordinates,
        hasLandmark: !!pickupLocation.landmark,
        isInUse: false,
        completenessScore,
        parsedCoordinates,
        routeStopsByRoute: [],
        usage: {
          totalConnectedRoutes: 0,
          activeConnectedRoutes: 0,
          scheduledRoutes: 0,
          isOperational: false,
        },
        validation: {
          hasRequiredFields: !!(pickupLocation.name && pickupLocation.address),
          hasOptionalEnhancements: !!(pickupLocation.landmark || pickupLocation.coordinates),
          coordinatesFormat: pickupLocation.coordinates
            ? /^-?\d+\.?\d*,-?\d+\.?\d*$/.test(pickupLocation.coordinates)
            : null,
          issues: [
            ...(!pickupLocation.name ? ['Missing name'] : []),
            ...(!pickupLocation.address ? ['Missing address'] : []),
            ...(pickupLocation.coordinates &&
            !/^-?\d+\.?\d*,-?\d+\.?\d*$/.test(pickupLocation.coordinates)
              ? ['Invalid coordinates format']
              : []),
          ],
        },
      };

      return {
        pickupLocation: {
          ...pickupLocation,
          summary,
        },
      };
    }
  });
