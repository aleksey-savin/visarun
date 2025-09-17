import { visarunRouteStopDeleteProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zDeleteVisarunRouteStopTrpcInput = z.object({
  id: z.string().uuid('Invalid route stop ID'),
});

export const deleteVisarunRouteStopTrpcRoute = visarunRouteStopDeleteProcedure
  .input(zDeleteVisarunRouteStopTrpcInput)
  .mutation(async ({ input, ctx }) => {
    const { id } = input;

    // Check if route stop exists
    const existingRouteStop = await ctx.prisma.visarunRouteStop.findUnique({
      where: { id },
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
        VisarunPassenger: true,
      },
    });

    if (!existingRouteStop) {
      throw new Error('Route stop not found');
    }

    // Check if route has active schedules
    if (existingRouteStop.route.VisarunSchedule.length > 0) {
      throw new Error(
        'Cannot delete route stop from route with active schedules. Please deactivate all schedules first.'
      );
    }

    // Check if route has any trips
    if (existingRouteStop.route.VisarunTrip.length > 0) {
      throw new Error(
        'Cannot delete route stop from route with existing trips. This stop has historical data that must be preserved.'
      );
    }

    // Check if there are any passengers associated with this stop
    if (existingRouteStop.VisarunPassenger.length > 0) {
      throw new Error(
        'Cannot delete route stop with existing passenger records. This stop has booking data that must be preserved.'
      );
    }

    // Get all stops for this route to check if this is the only stop
    const allRouteStops = await ctx.prisma.visarunRouteStop.findMany({
      where: {
        routeId: existingRouteStop.routeId,
      },
    });

    if (allRouteStops.length === 1) {
      throw new Error(
        'Cannot delete the only stop on a route. A route must have at least one stop.'
      );
    }

    // Check if this is a departure or arrival stop and ensure there's at least one of each remaining
    if (existingRouteStop.stopType === 'departure') {
      const otherDepartureStops = allRouteStops.filter(
        stop => stop.stopType === 'departure' && stop.id !== id
      );
      if (otherDepartureStops.length === 0) {
        throw new Error(
          'Cannot delete the only departure stop. A route must have at least one departure stop.'
        );
      }
    }

    if (existingRouteStop.stopType === 'arrival') {
      const otherArrivalStops = allRouteStops.filter(
        stop => stop.stopType === 'arrival' && stop.id !== id
      );
      if (otherArrivalStops.length === 0) {
        throw new Error(
          'Cannot delete the only arrival stop. A route must have at least one arrival stop.'
        );
      }
    }

    // Delete the route stop (cascade will handle pickup location associations)
    await ctx.prisma.visarunRouteStop.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Route stop deleted successfully',
    };
  });
