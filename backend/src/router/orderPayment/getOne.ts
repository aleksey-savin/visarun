import { orderPaymentReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

const zGetOneOrderPaymentInput = z.object({
  id: z.string().uuid(),
});

export const getOneOrderPaymentTrpcRoute = orderPaymentReadProcedure
  .input(zGetOneOrderPaymentInput)
  .query(async ({ input, ctx }) => {
    const orderPayment = await ctx.prisma.orderPayment.findUnique({
      where: { id: input.id },
      select: {
        id: true,
        orderId: true,
        amount: true,
        currencyId: true,
        paidAt: true,
        paymentMethod: true,
        documentUrl: true,
        order: {
          select: {
            id: true,
            status: true,
            comment: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        currency: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!orderPayment) {
      throw new Error('Order payment not found');
    }

    return { orderPayment };
  });
