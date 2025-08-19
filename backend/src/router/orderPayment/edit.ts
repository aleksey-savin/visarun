import { orderPaymentUpdateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

const zEditOrderPaymentInput = z.object({
  id: z.string().uuid(),
  orderId: z.string().uuid().optional(),
  amount: z.number().positive().optional(),
  currencyId: z.string().uuid().optional(),
  paidAt: z.string().datetime().optional(),
  paymentMethod: z.enum(['cash', 'transfer']).optional(),
  documentUrl: z.string().url().optional().or(z.literal('')),
});

export const editOrderPaymentTrpcRoute = orderPaymentUpdateProcedure
  .input(zEditOrderPaymentInput)
  .mutation(async ({ input, ctx }) => {
    // Check if order payment exists
    const existingOrderPayment = await ctx.prisma.orderPayment.findUnique({
      where: { id: input.id },
    });

    if (!existingOrderPayment) {
      throw new Error('Order payment not found');
    }

    // If orderId is being updated, check if the new order exists
    if (input.orderId && input.orderId !== existingOrderPayment.orderId) {
      const existingOrder = await ctx.prisma.order.findUnique({
        where: { id: input.orderId },
      });

      if (!existingOrder) {
        throw new Error('Order not found');
      }
    }

    // If currencyId is being updated, check if the new currency exists
    if (input.currencyId && input.currencyId !== existingOrderPayment.currencyId) {
      const existingCurrency = await ctx.prisma.currency.findUnique({
        where: { id: input.currencyId },
      });

      if (!existingCurrency) {
        throw new Error('Currency not found');
      }
    }

    // Prepare update data
    const updateData: Prisma.OrderPaymentUncheckedUpdateInput = {};

    if (input.orderId !== undefined) {
      updateData.orderId = input.orderId;
    }
    if (input.amount !== undefined) {
      updateData.amount = input.amount;
    }
    if (input.currencyId !== undefined) {
      updateData.currencyId = input.currencyId;
    }
    if (input.paidAt !== undefined) {
      updateData.paidAt = new Date(input.paidAt);
    }
    if (input.paymentMethod !== undefined) {
      updateData.paymentMethod = input.paymentMethod;
    }
    if (input.documentUrl !== undefined) {
      updateData.documentUrl = input.documentUrl === '' ? null : input.documentUrl;
    }

    const orderPayment = await ctx.prisma.orderPayment.update({
      where: { id: input.id },
      data: updateData,
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
