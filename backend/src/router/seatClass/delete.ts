import { seatClassDeleteProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zDeleteSeatClassTrpcInput = z.object({
  id: z.string().uuid(),
});

export const deleteSeatClassTrpcRoute = seatClassDeleteProcedure
  .input(zDeleteSeatClassTrpcInput)
  .mutation(async ({ input, ctx }) => {
    // Check if seat class exists
    const existingSeatClass = await ctx.prisma.seatClass.findUnique({
      where: { id: input.id },
    });

    if (!existingSeatClass) {
      throw new Error('Seat class not found');
    }

    // TODO: Add checks for related entities if needed
    // For example, check if seat class is used in seat prices, bookings, etc.

    // Delete the seat class
    await ctx.prisma.seatClass.delete({
      where: { id: input.id },
    });

    return {
      success: true,
    };
  });
