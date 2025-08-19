import { orderPaymentDeleteProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

const zDeleteOrderPaymentInput = z.object({
  id: z.string().uuid(),
});

export const deleteOrderPaymentTrpcRoute = orderPaymentDeleteProcedure
  .input(zDeleteOrderPaymentInput)
  .mutation(async ({ input, ctx }) => {
    // Check if order payment exists
    const existingOrderPayment = await ctx.prisma.orderPayment.findUnique({
      where: { id: input.id },
    });

    if (!existingOrderPayment) {
      throw new Error('Order payment not found');
    }

    await ctx.prisma.orderPayment.delete({
      where: { id: input.id },
    });

    return { success: true };
  });
