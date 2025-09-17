import { z } from 'zod';
import { visarunSeatPriceCreateProcedure } from '../../lib/trpc.js';

export const zCreateVisarunSeatPriceTrpcInput = z.object({
  seatClassId: z.string().uuid('Invalid seat class ID'),
  price: z.number().min(0, 'Price must be non-negative'),
  routeId: z.string().uuid('Invalid route ID'),
});

export const createVisarunSeatPriceTrpcRoute = visarunSeatPriceCreateProcedure
  .input(zCreateVisarunSeatPriceTrpcInput)
  .mutation(async ({ input, ctx }) => {
    const { seatClassId, price, routeId } = input;

    // Check if seat class exists
    const seatClass = await ctx.prisma.seatClass.findUnique({
      where: { id: seatClassId },
    });

    if (!seatClass) {
      throw new Error('Seat class not found');
    }

    // Check if route exists
    const route = await ctx.prisma.visarunRoute.findUnique({
      where: { id: routeId },
    });

    if (!route) {
      throw new Error('Route not found');
    }

    // Check if price for this seat class and route already exists
    const existingPrice = await ctx.prisma.visarunSeatPrice.findFirst({
      where: {
        seatClassId,
        routeId,
      },
    });

    if (existingPrice) {
      throw new Error('Price for this seat class and route already exists');
    }

    const visarunSeatPrice = await ctx.prisma.visarunSeatPrice.create({
      data: {
        seatClassId,
        price,
        routeId,
      },
      include: {
        seatClass: true,
        route: true,
      },
    });

    return {
      visarunSeatPrice,
    };
  });
