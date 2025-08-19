import { orderPaymentCreateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

const zCreateOrderPaymentInput = z.object({
  orderId: z.string().uuid(),
  amount: z.number().positive(),
  currencyId: z.string().uuid(),
  paidAt: z.string().datetime(),
  paymentMethod: z.enum(['cash', 'transfer']),
  documentUrl: z.string().url().optional(),
});

export const createOrderPaymentTrpcRoute = orderPaymentCreateProcedure
  .input(zCreateOrderPaymentInput)
  .mutation(async ({ input, ctx }) => {
    // Check if order exists
    const existingOrder = await ctx.prisma.order.findUnique({
      where: { id: input.orderId },
    });

    if (!existingOrder) {
      throw new Error('Order not found');
    }

    // Check if currency exists
    const existingCurrency = await ctx.prisma.currency.findUnique({
      where: { id: input.currencyId },
    });

    if (!existingCurrency) {
      throw new Error('Currency not found');
    }

    const orderPayment = await ctx.prisma.orderPayment.create({
      data: {
        orderId: input.orderId,
        amount: input.amount,
        currencyId: input.currencyId,
        paidAt: new Date(input.paidAt),
        paymentMethod: input.paymentMethod,
        documentUrl: input.documentUrl,
      },
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

    return { orderPayment };
  });
