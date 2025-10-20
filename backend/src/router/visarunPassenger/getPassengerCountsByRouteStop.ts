import { visarunPassengerReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zGetPassengerCountsByRouteStopTrpcInput = z.object({
  tripId: z.string().uuid(),
});

export const getPassengerCountsByRouteStopTrpcRoute = visarunPassengerReadProcedure
  .input(zGetPassengerCountsByRouteStopTrpcInput)
  .query(async ({ input, ctx }) => {
    const passengerCounts = await ctx.prisma.visarunPassenger.groupBy({
      by: ['routeStopId'],
      where: {
        tripId: input.tripId,
        status: {
          in: ['confirmed', 'checked_in'],
        },
        routeStopId: {
          not: null,
        },
      },
      _count: {
        id: true,
      },
    });

    // Convert to a map of routeStopId -> count for easier lookup
    const countMap = passengerCounts.reduce(
      (acc, item) => {
        if (item.routeStopId) {
          acc[item.routeStopId] = item._count.id;
        }
        return acc;
      },
      {} as Record<string, number>
    );

    return countMap;
  });
