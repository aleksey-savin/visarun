import { orderDeleteProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zDeleteOrderTrpcInput = z.object({
  id: z.string().uuid(),
});

export const deleteOrderTrpcRoute = orderDeleteProcedure
  .input(zDeleteOrderTrpcInput)
  .mutation(async ({ input, ctx }) => {
    // Check if order exists
    const existingOrder = await ctx.prisma.order.findUnique({
      where: { id: input.id },
      include: {
        items: true,
      },
    });

    if (!existingOrder) {
      throw new Error('Order not found');
    }

    // Check if order can be deleted (only draft orders can be deleted)
    if (existingOrder.status !== 'draft') {
      throw new Error('Only draft orders can be deleted');
    }

    // Delete order (this will cascade delete order items due to foreign key constraints)
    await ctx.prisma.order.delete({
      where: { id: input.id },
    });

    return {
      success: true,
      message: 'Order deleted successfully',
    };
  });
