/*
TODO:
    Add permission in transactionCreateProcedure
 */

import { transactionCreateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zCreateTransactionTrpcInput = z.object({
  currencyExchangeId: z.string().uuid(),
  senderId: z.string().uuid().optional(),
  isCompanyTransaction: z.boolean().optional().default(true),
  begottenByCurrencyExchangeId: z.string().uuid().optional(),
  maximumAmountInSelectedCurrency: z.number(),
});

export const createMaximumTransactionTrpcRoute = transactionCreateProcedure
  .input(zCreateTransactionTrpcInput)
  .mutation(async ({ input, ctx }) => {
    if (!ctx.user?.id) {
      throw new Error('User must be authenticated to create a Transaction');
    }

    // Sender existence validation
    if (input.senderId) {
      const sender = await ctx.prisma.client.findUnique({
        where: { id: input.senderId },
      });

      if (!sender) {
        throw new Error('Sender does not exist');
      }
    }

    let newTransaction = undefined;

    // One prisma transaction not to get race condition
    await ctx.prisma.$transaction(async tx => {
      // CurrencyExchange existence validation
      const exchange = await tx.currencyExchange.findUnique({
        where: { id: input.currencyExchangeId },
        select: {
          amountInSelectedCurrencyTo: true,
          minTransactionAmountInSelectedCurrency: true,
        },
      });

      if (!exchange) {
        throw new Error('CurrencyExchange does not exist');
      }

      const { _sum } = await tx.transaction.aggregate({
        where: { currencyExchangeId: input.currencyExchangeId },
        _sum: { amountInSelectedCurrency: true },
      });

      const totalAmount = Number(_sum.amountInSelectedCurrency ?? 0);
      const difference = Number(exchange.amountInSelectedCurrencyTo ?? 0) - totalAmount;

      // Min transaction amount validation
      const minAmount = Number(exchange.minTransactionAmountInSelectedCurrency ?? 0);
      if (difference < minAmount || difference <= 0) {
        throw new Error(
          "Transaction can't be created because of remaining amount is smaller minTransactionAmountInSelectedCurrency"
        );
      }

      const maximumAmountInSelectedCurrency = Math.min(
        difference,
        input.maximumAmountInSelectedCurrency
      );

      if (maximumAmountInSelectedCurrency <= 0) {
        throw new Error('amountInSelectedCurrency must be greater than 0');
      }

      if (!ctx.user?.id) {
        throw new Error('User must be authenticated to create a Transaction');
      }

      newTransaction = await tx.transaction.create({
        data: {
          amountInSelectedCurrency: maximumAmountInSelectedCurrency,
          currencyExchangeId: input.currencyExchangeId,
          begottenByCurrencyExchangeId: input.begottenByCurrencyExchangeId,
          isCompanyTransaction: input.isCompanyTransaction,
          senderId: input.senderId,
          createdById: ctx.user.id,
          updatedById: ctx.user.id,
        },
      });
    });

    return { newTransaction };
  });
