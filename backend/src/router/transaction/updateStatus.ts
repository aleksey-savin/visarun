/*
TODO:
    Add permission in transactionUpdateProcedure
 */

import { transactionUpdateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zUpdateStatusTransactionTrpcInput = z.object({
  id: z.string().uuid(),
  status: z.enum([
    'draft',
    'details_sent',
    'check_uploaded',
    'paid_uninformed',
    'paid_informed',
    'completed',
    'cancelled',
  ]),
});

export const updateStatusTransactionTrpcRoute = transactionUpdateProcedure
  .input(zUpdateStatusTransactionTrpcInput)
  .mutation(async ({ input, ctx }) => {
    const { id, status } = input;

    if (!ctx.user?.id) {
      throw new Error('User must be authenticated to edit the Transaction');
    }

    // Check if transaction exists
    const existingTransaction = await ctx.prisma.transaction.findUnique({
      where: { id },
      select: {
        status: true,
        senderId: true,
        checkUrl: true,
        amountInSelectedCurrency: true,
        isCompanyTransaction: true,
        currencyExchange: {
          select: {
            amountInSelectedCurrencyTo: true,
            minTransactionAmountInSelectedCurrency: true,
            transactions: {
              where: {
                id: { not: id },
              },
              select: {
                amountInSelectedCurrency: true,
              },
            },
          },
        },
      },
    });

    if (!existingTransaction) {
      throw new Error('Transaction not found');
    }

    // Validate status transitions
    const currentStatus = existingTransaction.status;
    const validTransitions: Record<string, string[]> = {
      draft: ['details_sent', 'check_uploaded'],
      details_sent: ['draft', 'check_uploaded'],
      check_uploaded: ['details_sent', 'draft', 'paid_uninformed'],
      paid_uninformed: ['paid_informed'],
      paid_informed: ['paid_uninformed', 'completed'],
      completed: [],
      cancelled: [],
    };

    // Allow same-status transitions
    const isSameStatus = currentStatus === status;
    const isValidTransition = validTransitions[currentStatus]?.includes(status);

    if (!isSameStatus && !isValidTransition) {
      throw new Error(`Invalid status transition from ${currentStatus} to ${status}`);
    }

    // Update currency exchange status
    const transaction = await ctx.prisma.transaction.update({
      where: { id },
      data: {
        status,
      },
    });

    return { transaction };
  });
