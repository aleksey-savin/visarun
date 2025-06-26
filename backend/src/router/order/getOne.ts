import { orderReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zGetOrderTrpcInput = z.object({
  id: z.string().uuid(),
});

export const getOrderTrpcRoute = orderReadProcedure
  .input(zGetOrderTrpcInput)
  .query(async ({ input, ctx }) => {
    const order = await ctx.prisma.order.findUnique({
      where: { id: input.id },
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

    if (!order) {
      throw new Error('Order not found');
    }

    return {
      order,
    };
  });
