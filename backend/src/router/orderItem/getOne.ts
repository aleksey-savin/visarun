import { orderItemReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zGetOrderItemTrpcInput = z.object({
  id: z.string().uuid(),
});

export const getOrderItemTrpcRoute = orderItemReadProcedure
  .input(zGetOrderItemTrpcInput)
  .query(async ({ input, ctx }) => {
    const orderItem = await ctx.prisma.orderItem.findUnique({
      where: { id: input.id },
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
                visaFree: true,
                blacklisted: true,
                surcharges: true,
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
    });

    if (!orderItem) {
      throw new Error('Order item not found');
    }

    return {
      orderItem,
    };
  });
