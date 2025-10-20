import { orderItemDeleteProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zDeleteVisarunPassengerTrpcInput = z.object({
  id: z.string().uuid(),
});

export const deleteVisarunPassengerTrpcRoute = orderItemDeleteProcedure
  .input(zDeleteVisarunPassengerTrpcInput)
  .mutation(async ({ input, ctx }) => {
    // Check if visarun passenger exists
    const existingVisarunPassenger = await ctx.prisma.visarunPassenger.findUnique({
      where: { id: input.id },
      include: {
        orderItem: {
          include: {
            order: true,
          },
        },
      },
    });

    if (!existingVisarunPassenger) {
      throw new Error('Visarun passenger not found');
    }

    // Check if order is in draft status (can only delete passengers from draft orders)
    if (existingVisarunPassenger.orderItem.order.status !== 'draft') {
      throw new Error('Can only delete visarun passengers from draft orders');
    }

    // Delete visarun passenger
    await ctx.prisma.visarunPassenger.delete({
      where: { id: input.id },
    });

    return {
      success: true,
      message: 'Visarun passenger deleted successfully',
    };
  });
