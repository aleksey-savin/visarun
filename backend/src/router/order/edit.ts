import { orderUpdateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zEditOrderTrpcInput = z.object({
  id: z.string().uuid(),
  status: z.enum(['draft', 'submitted', 'paid', 'cancelled']).optional(),
});

export const editOrderTrpcRoute = orderUpdateProcedure
  .input(zEditOrderTrpcInput)
  .mutation(async ({ input, ctx }) => {
    const { id, ...updateData } = input;

    // Check if order exists
    const existingOrder = await ctx.prisma.order.findUnique({
      where: { id },
    });

    if (!existingOrder) {
      throw new Error('Order not found');
    }

    // Update order
    const order = await ctx.prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            middleName: true,
            lastName: true,
            email: true,
          },
        },
        items: {
          include: {
            client: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                citizenship: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            discountRule: {
              select: {
                id: true,
                name: true,
                discountType: true,
                discountValue: true,
              },
            },
          },
          orderBy: {
            id: 'asc',
          },
        },
      },
    });

    return {
      order,
    };
  });
