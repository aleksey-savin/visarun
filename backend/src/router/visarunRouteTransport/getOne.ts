import { visarunRouteTransportReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zGetVisarunRouteTransportTrpcInput = z.object({
  id: z.string().uuid('Invalid route transport ID'),
});

export const getVisarunRouteTransportTrpcRoute = visarunRouteTransportReadProcedure
  .input(zGetVisarunRouteTransportTrpcInput)
  .query(async ({ input, ctx }) => {
    const routeTransport = await ctx.prisma.visarunRouteTransport.findUnique({
      where: { id: input.id },
      include: {
        route: {
          include: {
            routeStops: {
              include: {
                city: true,
              },
              orderBy: {
                stopOrder: 'asc',
              },
            },
            prices: {
              include: {
                seatClass: true,
              },
            },
          },
        },
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
    });

    if (!routeTransport) {
      throw new Error('Route transport assignment not found');
    }

    // Add detailed summary information
    const totalSeats = routeTransport.transport.seatCount || 0;
    const allocatedSeats =
      routeTransport.transport.seatDistribution?.reduce((sum, dist) => sum + dist.seatCount, 0) ||
      0;

    const summary = {
      totalSeats,
      allocatedSeats,
      remainingSeats: totalSeats - allocatedSeats,
      hasSeatingArrangement: allocatedSeats > 0,
      routeStopsCount: routeTransport.route.routeStops?.length || 0,
      priceRulesCount: routeTransport.route.prices?.length || 0,
      seatClassesAvailable: routeTransport.transport.seatDistribution?.length || 0,
      isFullyConfigured:
        (routeTransport.route.routeStops?.length || 0) > 0 &&
        (routeTransport.route.prices?.length || 0) > 0 &&
        allocatedSeats > 0,
    };

    return {
      routeTransport: {
        ...routeTransport,
        summary,
      },
    };
  });
