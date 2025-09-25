import { visarunTripReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zGetVisarunTripTrpcInput = z.object({
  id: z.string().uuid(),
});

export const getVisarunTripTrpcRoute = visarunTripReadProcedure
  .input(zGetVisarunTripTrpcInput)
  .query(async ({ input, ctx }) => {
    const trip = await ctx.prisma.visarunTrip.findUnique({
      where: { id: input.id },
      include: {
        route: {
          select: {
            id: true,
            name: true,
          },
        },
        schedule: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!trip) {
      throw new Error('Trip not found');
    }

    return trip;
  });
