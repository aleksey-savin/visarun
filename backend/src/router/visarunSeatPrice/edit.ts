import { z } from 'zod';
import { visarunSeatPriceUpdateProcedure } from '../../lib/trpc.js';

export const zEditVisarunSeatPriceTrpcInput = z.object({
  id: z.string().uuid('Invalid ID'),
  seatClassId: z.string().uuid('Invalid seat class ID').optional(),
  price: z.number().min(0, 'Price must be non-negative').optional(),
  routeId: z.string().uuid('Invalid route ID').optional(),
});

export const editVisarunSeatPriceTrpcRoute = visarunSeatPriceUpdateProcedure
  .input(zEditVisarunSeatPriceTrpcInput)
  .mutation(async ({ input, ctx }) => {
    const { id, seatClassId, price, routeId } = input;

    // Check if the price record exists
    const existingPrice = await ctx.prisma.visarunSeatPrice.findUnique({
      where: { id },
    });

    if (!existingPrice) {
      throw new Error('VisarunSeatPrice not found');
    }

    // If seatClassId is being updated, check if it exists
    if (seatClassId) {
      const seatClass = await ctx.prisma.seatClass.findUnique({
        where: { id: seatClassId },
      });

      if (!seatClass) {
        throw new Error('Seat class not found');
      }
    }

    // If routeId is being updated, check if it exists
    if (routeId) {
      const route = await ctx.prisma.visarunRoute.findUnique({
        where: { id: routeId },
      });

      if (!route) {
        throw new Error('Route not found');
      }
    }

    // Check for duplicate combination if seatClassId or routeId is being updated
    if (seatClassId || routeId) {
      const duplicateCheck = await ctx.prisma.visarunSeatPrice.findFirst({
        where: {
          seatClassId: seatClassId || existingPrice.seatClassId,
          routeId: routeId || existingPrice.routeId,
          id: {
            not: id,
          },
        },
      });

      if (duplicateCheck) {
        throw new Error('Price for this seat class and route already exists');
      }
    }

    const updatedVisarunSeatPrice = await ctx.prisma.visarunSeatPrice.update({
      where: { id },
      data: {
        ...(seatClassId && { seatClassId }),
        ...(price !== undefined && { price }),
        ...(routeId && { routeId }),
      },
      include: {
        seatClass: true,
        route: true,
      },
    });

    return {
      visarunSeatPrice: updatedVisarunSeatPrice,
    };
  });
