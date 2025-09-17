import { pickupLocationDeleteProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zDeletePickupLocationTrpcInput = z.object({
  id: z.string().uuid('Invalid pickup location ID'),
});

export const deletePickupLocationTrpcRoute = pickupLocationDeleteProcedure
  .input(zDeletePickupLocationTrpcInput)
  .mutation(async ({ input, ctx }) => {
    const { id } = input;

    // Check if pickup location exists
    const existingPickupLocation = await ctx.prisma.pickupLocation.findUnique({
      where: { id },
      include: {
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
                    },
                    VisarunTrip: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!existingPickupLocation) {
      throw new Error('Pickup location not found');
    }

    // Check if pickup location is being used by any active routes
    const activeRoutes =
      existingPickupLocation.routeStops?.filter(rs => rs.routeStop.route.isActive) || [];

    if (activeRoutes.length > 0) {
      const routeNames = activeRoutes.map(rs => rs.routeStop.route.name).join(', ');
      throw new Error(
        `Cannot delete pickup location that is used by active routes: ${routeNames}. Please deactivate these routes first.`
      );
    }

    // Check if pickup location is being used by routes with active schedules
    const routesWithActiveSchedules =
      existingPickupLocation.routeStops?.filter(
        rs => rs.routeStop.route.VisarunSchedule && rs.routeStop.route.VisarunSchedule.length > 0
      ) || [];

    if (routesWithActiveSchedules.length > 0) {
      const routeNames = routesWithActiveSchedules.map(rs => rs.routeStop.route.name).join(', ');
      throw new Error(
        `Cannot delete pickup location that is used by routes with active schedules: ${routeNames}. Please deactivate all schedules first.`
      );
    }

    // Check if pickup location has historical trip data
    const routesWithTrips =
      existingPickupLocation.routeStops?.filter(
        rs => rs.routeStop.route.VisarunTrip && rs.routeStop.route.VisarunTrip.length > 0
      ) || [];

    if (routesWithTrips.length > 0) {
      throw new Error(
        'Cannot delete pickup location with historical trip data. This location has booking records that must be preserved for audit purposes.'
      );
    }

    // Delete the pickup location (cascade will handle route stop associations)
    await ctx.prisma.pickupLocation.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Pickup location deleted successfully',
    };
  });
