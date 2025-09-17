import { visarunRouteUpdateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zEditVisarunRouteTrpcInput = z.object({
  id: z.string().uuid('Invalid route ID'),
  stamp: z.boolean().optional(),
  visa: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const editVisarunRouteTrpcRoute = visarunRouteUpdateProcedure
  .input(zEditVisarunRouteTrpcInput)
  .mutation(async ({ input, ctx }) => {
    const { id, ...updateData } = input;

    // Check if route exists
    const existingRoute = await ctx.prisma.visarunRoute.findUnique({
      where: { id },
    });

    if (!existingRoute) {
      throw new Error('Route not found');
    }

    // Update the route
    const updatedRoute = await ctx.prisma.visarunRoute.update({
      where: { id },
      data: updateData,
      include: {
        routeStops: {
          include: {
            city: true,
            pickupLocations: {
              include: {
                pickupLocation: true,
              },
            },
          },
          orderBy: {
            stopOrder: 'asc',
          },
        },
        transports: {
          include: {
            transport: {
              include: {
                transportType: true,
              },
            },
          },
        },
        prices: {
          include: {
            seatClass: true,
          },
        },
        VisarunSchedule: {
          where: {
            isActive: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    return {
      route: updatedRoute,
    };
  });
