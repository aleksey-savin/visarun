import { visarunRouteTransportUpdateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zEditVisarunRouteTransportTrpcInput = z.object({
  id: z.string().uuid('Invalid route transport ID'),
  isActive: z.boolean().optional(),
});

export const editVisarunRouteTransportTrpcRoute = visarunRouteTransportUpdateProcedure
  .input(zEditVisarunRouteTransportTrpcInput)
  .mutation(async ({ input, ctx }) => {
    const { id, ...updateData } = input;

    // Check if route transport assignment exists
    const existingRouteTransport = await ctx.prisma.visarunRouteTransport.findUnique({
      where: { id },
    });

    if (!existingRouteTransport) {
      throw new Error('Route transport assignment not found');
    }

    // Update the route transport assignment
    const updatedRouteTransport = await ctx.prisma.visarunRouteTransport.update({
      where: { id },
      data: updateData,
      include: {
        route: true,
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

    return {
      routeTransport: updatedRouteTransport,
    };
  });
