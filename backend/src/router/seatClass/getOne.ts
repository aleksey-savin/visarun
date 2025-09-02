import { seatClassReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zGetSeatClassTrpcInput = z.object({
  id: z.string().uuid(),
});

export const getSeatClassTrpcRoute = seatClassReadProcedure
  .input(zGetSeatClassTrpcInput)
  .query(async ({ input, ctx }) => {
    const seatClass = await ctx.prisma.seatClass.findUnique({
      where: { id: input.id },
    });

    if (!seatClass) {
      throw new Error('Seat class not found');
    }

    return {
      seatClass,
    };
  });
