import { orderItemReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zGetAllOrderItemsByOrderIdTrpcInput = z.object({
  orderId: z.string().uuid(),
  limit: z.number().min(1).max(100).optional().default(20),
  offset: z.number().min(0).optional().default(0),
});

export const getAllOrderItemsByOrderIdTrpcRoute = orderItemReadProcedure
  .input(zGetAllOrderItemsByOrderIdTrpcInput)
  .query(async ({ input, ctx }) => {
    // Check if order exists
    const order = await ctx.prisma.order.findUnique({
      where: { id: input.orderId },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    const [orderItems, totalCount] = await Promise.all([
      ctx.prisma.orderItem.findMany({
        where: {
          orderId: input.orderId,
        },
        include: {
          order: {
            select: {
              id: true,
              status: true,
              createdAt: true,
              user: {
                select: {
                  id: true,
                  firstName: true,
                  middleName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
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
              appliesToService: true,
            },
          },
        },
        orderBy: {
          id: 'asc',
        },
        take: input.limit,
        skip: input.offset,
      }),
      ctx.prisma.orderItem.count({
        where: {
          orderId: input.orderId,
        },
      }),
    ]);

    return {
      orderItems,
      totalCount,
      hasMore: input.offset + input.limit < totalCount,
    };
  });
