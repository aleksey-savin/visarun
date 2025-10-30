import { visarunRouteTransportCreateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zCreateVisarunRouteTransportTrpcInput = z.object({
  routeId: z.string().uuid('Invalid route ID'),
  transportId: z.string().uuid('Invalid transport ID'),
  isActive: z.boolean().optional().default(true),
  isDefault: z.boolean().optional().default(false),
});

export const createVisarunRouteTransportTrpcRoute = visarunRouteTransportCreateProcedure
  .input(zCreateVisarunRouteTransportTrpcInput)
  .mutation(async ({ input, ctx }) => {
    // Check if route exists
    const route = await ctx.prisma.visarunRoute.findUnique({
      where: { id: input.routeId },
    });

    if (!route) {
      throw new Error('Route not found');
    }

    // Check if transport exists
    const transport = await ctx.prisma.transport.findUnique({
      where: { id: input.transportId },
    });

    if (!transport) {
      throw new Error('Transport not found');
    }

    // Check if the route-transport combination already exists
    const existingRouteTransport = await ctx.prisma.visarunRouteTransport.findUnique({
      where: {
        routeId_transportId: {
          routeId: input.routeId,
          transportId: input.transportId,
        },
      },
    });

    if (existingRouteTransport) {
      throw new Error('This transport is already assigned to this route');
    }

    // If setting this transport as default, ensure no other transport on the same route is default
    if (input.isDefault === true) {
      await ctx.prisma.visarunRouteTransport.updateMany({
        where: {
          routeId: input.routeId,
        },
        data: {
          isDefault: false,
        },
      });
    }

    // Create the route-transport assignment
    const routeTransport = await ctx.prisma.visarunRouteTransport.create({
      data: {
        routeId: input.routeId,
        transportId: input.transportId,
        isActive: input.isActive,
        isDefault: input.isDefault,
      },
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
      routeTransport,
    };
  });
