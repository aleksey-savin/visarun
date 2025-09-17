import { z } from 'zod';
import { visarunSeatPriceReadProcedure } from '../../lib/trpc.js';

export const zGetVisarunSeatPriceTrpcInput = z.object({
  id: z.string().uuid('Invalid ID'),
});

export const getVisarunSeatPriceTrpcRoute = visarunSeatPriceReadProcedure
  .input(zGetVisarunSeatPriceTrpcInput)
  .query(async ({ input, ctx }) => {
    const { id } = input;

    const visarunSeatPrice = await ctx.prisma.visarunSeatPrice.findUnique({
      where: { id },
      include: {
        seatClass: true,
        route: {
          include: {
            routeStops: {
              include: {
                city: {
                  include: {
                    country: true,
                  },
                },
              },
              orderBy: {
                stopOrder: 'asc',
              },
            },
          },
        },
      },
    });

    if (!visarunSeatPrice) {
      throw new Error('VisarunSeatPrice not found');
    }

    return {
      visarunSeatPrice,
    };
  });
