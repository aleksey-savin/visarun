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

    // Check if route has active schedules
    if (existingRouteTransport.route.VisarunSchedule.length > 0) {
      throw new Error(
        'Cannot remove transport from route with active schedules. Please deactivate all schedules first.'
      );
    }

    // Check if route has any trips using this transport
    if (existingRouteTransport.route.VisarunTrip.length > 0) {
      throw new Error(
        'Cannot remove transport from route with existing trips. This assignment has historical data that must be preserved.'
      );
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
