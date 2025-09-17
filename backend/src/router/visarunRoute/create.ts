import { visarunRouteCreateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zCreateVisarunRouteTrpcInput = z.object({
  stamp: z.boolean().optional().default(false),
  visa: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
});

export const createVisarunRouteTrpcRoute = visarunRouteCreateProcedure
  .input(zCreateVisarunRouteTrpcInput)
  .mutation(async ({ input, ctx }) => {
    // Create the visarun route
    const route = await ctx.prisma.visarunRoute.create({
      data: {
        stamp: input.stamp,
        visa: input.visa,
        isActive: input.isActive,
      },
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
      route,
    };
  });
