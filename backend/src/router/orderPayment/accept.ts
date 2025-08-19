import { orderPaymentAcceptProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

const zAcceptOrderPaymentInput = z.object({
  id: z.string().uuid(),
  notes: z.string().optional(),
});

export const acceptOrderPaymentTrpcRoute = orderPaymentAcceptProcedure
  .input(zAcceptOrderPaymentInput)
  .mutation(async ({ input, ctx }) => {
    // Check if order payment exists
    const existingOrderPayment = await ctx.prisma.orderPayment.findUnique({
      where: { id: input.id },
      include: {
        order: {
          select: {
            id: true,
            status: true,
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

    if (!existingOrderPayment) {
      throw new Error('Order payment not found');
    }

    // Here you can add business logic for accepting the payment
    // For example, you might want to:
    // 1. Update the order status
    // 2. Send notifications
    // 3. Log the acceptance
    // 4. Update payment status if you have one

    // For now, we'll just log the acceptance and potentially add notes
    // You might want to add an "acceptedAt" field and "acceptedBy" field to the schema later

    // Create an audit log entry for the payment acceptance
    await ctx.prisma.auditLog.create({
      data: {
        userId: ctx.user!.id,
        entityType: 'OrderPayment',
        entityId: input.id,
        action: 'update',
        performedAt: new Date(),
        diff: {
          action: 'payment_accepted',
          notes: input.notes,
          acceptedBy: ctx.user!.id,
          acceptedAt: new Date().toISOString(),
        },
      },
    });

    return {
      success: true,
      orderPayment: {
        id: existingOrderPayment.id,
        orderId: existingOrderPayment.orderId,
        amount: existingOrderPayment.amount,
        currencyId: existingOrderPayment.currencyId,
        paidAt: existingOrderPayment.paidAt,
        paymentMethod: existingOrderPayment.paymentMethod,
        documentUrl: existingOrderPayment.documentUrl,
        order: existingOrderPayment.order,
        currency: existingOrderPayment.currency,
      },
      message: 'Payment accepted successfully',
    };
  });
