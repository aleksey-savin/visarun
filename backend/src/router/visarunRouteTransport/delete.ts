import { visarunRouteTransportDeleteProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zDeleteVisarunRouteTransportTrpcInput = z.object({
  id: z.string().uuid('Invalid route transport ID'),
});

export const deleteVisarunRouteTransportTrpcRoute = visarunRouteTransportDeleteProcedure
  .input(zDeleteVisarunRouteTransportTrpcInput)
  .mutation(async ({ input, ctx }) => {
    const { id } = input;

    // Check if route transport assignment exists
    const existingRouteTransport = await ctx.prisma.visarunRouteTransport.findUnique({
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
      },
    });

    if (!existingRouteTransport) {
      throw new Error('Route transport assignment not found');
    }

    // If route has active schedules, clean up scheduled trips without passengers first
    if (existingRouteTransport.route.VisarunSchedule.length > 0) {
      // Delete scheduled trips without passengers that are in the future
      await ctx.prisma.visarunTrip.deleteMany({
        where: {
          schedule: {
            route: {
              id: existingRouteTransport.route.id,
            },
          },
          status: 'scheduled',
          isFromSchedule: true,
          departureDateTime: {
            gte: new Date(),
          },
          // Only delete trips without passengers
          passengers: {
            none: {},
          },
          // Only delete trips without transport assignments
          transports: {
            none: {},
          },
        },
      });
    }

    // Delete the route transport assignment
    await ctx.prisma.visarunRouteTransport.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Route transport assignment deleted successfully',
    };
  });
