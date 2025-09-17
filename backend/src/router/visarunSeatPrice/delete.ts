import { z } from 'zod';
import { visarunSeatPriceDeleteProcedure } from '../../lib/trpc.js';

export const zDeleteVisarunSeatPriceTrpcInput = z.object({
  id: z.string().uuid('Invalid ID'),
});

export const deleteVisarunSeatPriceTrpcRoute = visarunSeatPriceDeleteProcedure
  .input(zDeleteVisarunSeatPriceTrpcInput)
  .mutation(async ({ input, ctx }) => {
    const { id } = input;

    // Check if the price record exists
    const existingPrice = await ctx.prisma.visarunSeatPrice.findUnique({
      where: { id },
      include: {
        seatClass: true,
        route: true,
      },
    });

    if (!existingPrice) {
      throw new Error('VisarunSeatPrice not found');
    }

    // Delete the price record
    const deletedVisarunSeatPrice = await ctx.prisma.visarunSeatPrice.delete({
      where: { id },
      include: {
        seatClass: true,
        route: true,
      },
    });

    return {
      visarunSeatPrice: deletedVisarunSeatPrice,
    };
  });
