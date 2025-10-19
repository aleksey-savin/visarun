import { orderPaymentCreateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

const zCreateOrderPaymentInput = z.object({
  orderId: z.string().uuid(),
  amount: z.number().positive().optional(),
  amountInSelectedCurrency: z.number().positive().optional(),
  currencyId: z.string().uuid().optional(),
  paidAt: z.string().datetime().optional(),
  paymentMethod: z.enum(['cash', 'transfer']).optional(),
  documentUrl: z.string().optional(),
  acceptedById: z.string().uuid().optional(),
  confirmPaymentWithoutDocument: z.boolean().optional(),
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
    // const existingCurrency = await ctx.prisma.currency.findUnique({
    //   where: { id: input.currencyId },
    // });

    // if (!existingCurrency) {
    //   throw new Error('Currency not found');
    // }

    const orderPayment = await ctx.prisma.orderPayment.create({
      data: {
        orderId: input.orderId,
        amount: input.amount || 0,
        amountInSelectedCurrency: input.amountInSelectedCurrency || 0,
        currencyId: input.currencyId ?? undefined,
        paidAt: new Date(),
        paymentMethod: input.paymentMethod || 'transfer',
        documentUrl: input.documentUrl,
        acceptedById: input.acceptedById,
        confirmPaymentWithoutDocument: input.confirmPaymentWithoutDocument || false,
      },
      select: {
        id: true,
        orderId: true,
        amount: true,
        amountInSelectedCurrency: true,
        currencyId: true,
        paidAt: true,
        paymentMethod: true,
        documentUrl: true,
        acceptedById: true,
        confirmPaymentWithoutDocument: true,
        acceptedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
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
