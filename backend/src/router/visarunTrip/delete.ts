import { visarunTripDeleteProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zDeleteVisarunTripTrpcInput = z.object({
  id: z.string().uuid(),
});

export const deleteVisarunTripTrpcRoute = visarunTripDeleteProcedure
  .input(zDeleteVisarunTripTrpcInput)
  .mutation(async ({ input, ctx }) => {
    const trip = await ctx.prisma.visarunTrip.delete({
      where: { id: input.id },
    });

    return { success: true, deletedId: trip.id };
  });
