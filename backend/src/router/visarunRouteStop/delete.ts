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
        city: true,
        VisarunPassenger: true,
      },
    });

    if (!existingRouteStop) {
      throw new Error('Route stop not found');
    }

    // If there are active schedules, we need to handle them properly
    // If there are active schedules, update scheduled trips to handle the removed stop
    if (existingRouteStop.route.VisarunSchedule.length > 0) {
      // Get scheduled trips that don't have passengers yet
      const scheduledTripsWithoutPassengers = existingRouteStop.route.VisarunTrip.filter(trip => {
        if (trip.status !== 'scheduled') return false;
        const hasPassengers = existingRouteStop.VisarunPassenger.some(
          passenger => passenger.tripId === trip.id
        );
        return !hasPassengers;
      });

      // Update only scheduled trips that don't have passengers
      if (scheduledTripsWithoutPassengers.length > 0) {
        await ctx.prisma.visarunTrip.updateMany({
          where: {
            id: {
              in: scheduledTripsWithoutPassengers.map(trip => trip.id),
            },
          },
          data: {
            notes: `Route stop "${existingRouteStop.city.name}" has been removed from this trip's route`,
          },
        });
      }

      // Note: Schedules themselves don't need updating as they reference routes, not individual stops
      // The schedule will continue to work with the remaining stops on the route
    }

    // Check if route has any non-scheduled trips or scheduled trips with passengers (preserve historical data)
    const tripsToPreserve = existingRouteStop.route.VisarunTrip.filter(trip => {
      if (trip.status !== 'scheduled') return true;
      const hasPassengers = existingRouteStop.VisarunPassenger.some(
        passenger => passenger.tripId === trip.id
      );
      return hasPassengers;
    });
    if (tripsToPreserve.length > 0) {
      throw new Error(
        'Cannot delete route stop from route with existing trips that have passengers or are non-scheduled. This stop has data that must be preserved.'
      );
    }

    // This check is now covered by the trips check above, but keeping for clarity
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
