import { visarunRouteTransportUpdateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zEditVisarunRouteTransportTrpcInput = z.object({
  id: z.string().uuid('Invalid route transport ID'),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
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

    // If setting this transport as default, ensure no other transport on the same route is default
    if (updateData.isDefault === true) {
      await ctx.prisma.visarunRouteTransport.updateMany({
        where: {
          routeId: existingRouteTransport.routeId,
          id: { not: id },
        },
        data: {
          isDefault: false,
        },
      });
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
