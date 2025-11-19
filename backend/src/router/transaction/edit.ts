/*
TODO:
    Add permission in transactionUpdateProcedure
 */

import { transactionUpdateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zEditTransactionTrpcInput = z.object({
  id: z.string().uuid(),
  amountInSelectedCurrency: z.number().positive().optional(),
  checkUrl: z.string().nullable().optional(),
  senderId: z.string().uuid().optional(),
  isInCash: z.boolean().optional(),
});

export const editTransactionTrpcRoute = transactionUpdateProcedure
  .input(zEditTransactionTrpcInput)
  .mutation(async ({ input, ctx }) => {
    const { id, ...updateData } = input;

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

    // Transactions sum validation (must be smaller than exchange amount)
    if (
      existingTransaction.currencyExchange.amountInSelectedCurrencyTo &&
      input.amountInSelectedCurrency
    ) {
      const transactionsSum = existingTransaction.currencyExchange.transactions
        .filter(tr => !!tr.amountInSelectedCurrency)
        .reduce((acc, curr) => acc + Number(curr.amountInSelectedCurrency), 0);

      const exchangeAmount = Number(
        existingTransaction.currencyExchange.amountInSelectedCurrencyTo
      );

      if (exchangeAmount < transactionsSum + input.amountInSelectedCurrency) {
        throw new Error(
          'Transactions sum must be smaller than exchange amount (in selected currency)'
        );
      }
    }

    // Amount validation (must be greater than minTransactionAmount in CurrencyExchange)
    // Amount validation (must be greater than minTransactionAmount in CurrencyExchange)
    if (
      input.amountInSelectedCurrency &&
      existingTransaction.currencyExchange.minTransactionAmountInSelectedCurrency
    ) {
      const minAmount = Number(
        existingTransaction.currencyExchange.minTransactionAmountInSelectedCurrency
      );
      if (input.amountInSelectedCurrency < minAmount) {
        throw new Error(
          'Amount must be greater than minTransactionAmount in CurrencyExchange (in selected currency)'
        );
      }
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

    // amountInSelectedCurrency can be modified only in draft status
    if (
      ['details_sent', 'check_uploaded', 'paid_uninformed', 'paid_informed', 'completed'].includes(
        existingTransaction.status
      )
    ) {
      updateData.amountInSelectedCurrency = undefined;
    }

    // senderId can be modified only in draft or details_sent statuses or in check_uploaded, paid_uninformed, paid_informed if was not sat before
    if (
      (['check_uploaded', 'paid_uninformed', 'paid_informed'].includes(existingTransaction.status)
        && existingTransaction.senderId !== undefined
        && existingTransaction.senderId !== null)
      || ['completed'].includes(existingTransaction.status)
    ) {
      updateData.senderId = undefined;
    }

    // isInCash can be modified only in draft and details_sent status
    if (
      ['check_uploaded', 'paid_uninformed', 'paid_informed', 'completed'].includes(
        existingTransaction.status
      )
    ) {
      updateData.isInCash = undefined;
    }

    // checkUrl can be modified only in draft, details_sent and check_uploaded status
    if (['paid_uninformed', 'paid_informed', 'completed'].includes(existingTransaction.status)) {
      updateData.checkUrl = undefined;
    }

    // Update transaction
    const transaction = await ctx.prisma.transaction.update({
      where: { id },
      data: {
        ...updateData,
        updatedById: ctx.user.id,
      },
    });

    return { transaction };
  });
