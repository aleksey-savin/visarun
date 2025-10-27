import { currencyExchangeUpdateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zUpdateCurrencyExchangeStatusTrpcInput = z.object({
  id: z.string().uuid(),
  status: z.enum(['draft', 'in_progress', 'finished', 'cancelled']),
  cancelReason: z.string().optional(),
  canceledByClient: z.boolean().optional(),
});

export const updateCurrencyExchangeStatusTrpcRoute = currencyExchangeUpdateProcedure
  .input(zUpdateCurrencyExchangeStatusTrpcInput)
  .mutation(async ({ input, ctx }) => {
    const { id, status, cancelReason, canceledByClient } = input;

    if (!ctx.user?.id) {
      throw new Error('User must be authenticated to edit the Currency Exchange');
    }

    // Check if exchange exists
    const existingExchange = await ctx.prisma.currencyExchange.findUnique({
      where: { id },
      select: {
        isBegottening: true,
        status: true,
        amountInSelectedCurrencyTo: true,
        amountInSelectedCurrencyFrom: true,
        transactions: {
          select: {
            status: true,
            amountInSelectedCurrency: true,
          },
        },
        begottenTransactions: {
          select: {
            status: true,
            amountInSelectedCurrency: true,
          },
        },
      },
    });

    if (!existingExchange) {
      throw new Error('Currency exchange not found');
    }

    // Cancelled status validation for cancel reason
    if (status != 'cancelled' && cancelReason) {
      throw new Error("Cancel reason can be set only on 'cancelled' status");
    }

    // Cancel reason and canceled by client flag existence validation
    if (status == 'cancelled' && (!cancelReason || canceledByClient === undefined)) {
      throw new Error(
        "Cancel reason and canceled by client flag must be set on 'cancelled' status"
      );
    }

    // Validate status transitions
    const currentStatus = existingExchange.status;
    const validTransitions: Record<string, string[]> = {
      draft: ['in_progress'],
      in_progress: ['finished', 'cancelled'],
      finished: [],
      cancelled: [],
    };

    // Allow same-status transitions
    const isSameStatus = currentStatus === status;
    const isValidTransition = validTransitions[currentStatus]?.includes(status);

    if (!isSameStatus && !isValidTransition) {
      throw new Error(`Invalid status transition from ${currentStatus} to ${status}`);
    }

    //
    if (status === 'finished' && !existingExchange.isBegottening) {
      const finished = existingExchange.transactions
        .filter(tr => tr.status === 'completed' && tr.amountInSelectedCurrency)
        .reduce((acc, tr) => acc + Number(tr.amountInSelectedCurrency), 0);

      if (finished < Number(existingExchange.amountInSelectedCurrencyTo ?? 0)) {
        throw new Error(`Completed transactions must be enough to make exchange finished`);
      }

      await ctx.prisma.transaction.deleteMany({
        where: {
          AND: [{ currencyExchangeId: id }, { status: { in: ['details_sent', 'draft'] } }],
        },
      });
    } else if (status === 'finished' && existingExchange.isBegottening) {
      const finished = existingExchange.begottenTransactions
        .filter(tr => tr.status === 'completed' && tr.amountInSelectedCurrency)
        .reduce((acc, tr) => acc + Number(tr.amountInSelectedCurrency), 0);

      if (finished < Number(existingExchange.amountInSelectedCurrencyFrom ?? 0)) {
        throw new Error(`Completed begotten transactions must be enough to make exchange finished`);
      }
    }

    // Update currency exchange status
    const exchange = await ctx.prisma.currencyExchange.update({
      where: { id },
      data: {
        status,
        canceledByClient,
        cancelReason,
      },
    });

    return {
      exchange,
    };
  });
