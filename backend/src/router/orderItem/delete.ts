import { orderItemDeleteProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zDeleteOrderItemTrpcInput = z.object({
  id: z.string().uuid(),
});

export const deleteOrderItemTrpcRoute = orderItemDeleteProcedure
  .input(zDeleteOrderItemTrpcInput)
  .mutation(async ({ input, ctx }) => {
    // Check if order item exists
    const existingOrderItem = await ctx.prisma.orderItem.findUnique({
      where: { id: input.id },
      include: {
        order: true,
      },
    });

    if (!existingOrderItem) {
      throw new Error('Order item not found');
    }

    // Check if order is in draft status (can only delete items from draft orders)
    if (existingOrderItem.order.status !== 'draft') {
      throw new Error('Can only delete order items from draft orders');
    }

    // Delete order item
    await ctx.prisma.orderItem.delete({
      where: { id: input.id },
    });

    return {
      success: true,
      message: 'Order item deleted successfully',
    };
  });
