/*
TODO:
    Add permission in currencyExchangeReadProcedure
 */

import { currencyExchangeReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zGetOneCurrencyExchangeTrpcInput = z.object({
  id: z.string().uuid(),
});

export const getOneCurrencyExchangeTrpcRoute = currencyExchangeReadProcedure
  .input(zGetOneCurrencyExchangeTrpcInput)
  .query(async ({ input, ctx }) => {
    const exchange = await ctx.prisma.currencyExchange.findUnique({
      where: { id: input.id },
      select: {
        id: true,
        isBegottening: true,
        position: true,
        amountFrom: true,
        amountTo: true,
        amountInSelectedCurrencyFrom: true,
        amountInSelectedCurrencyTo: true,
        status: true,
        deadline: true,
        minTransactionAmount: true,
        minTransactionAmountInSelectedCurrency: true,
        createdAt: true,
        updatedAt: true,
        createdById: true,
        updatedById: true,
        orderItemId: true,
        canceledByClient: true,
        exchangeRate: true,
        orderItem: {
          select: {
            client: {
              select: {
                firstName: true,
                lastName: true,
                bankingDetails: {
                  select: {
                    id: true,
                    content: true,
                    documentUrl: true,
                  },
                },
                user: {
                  select: {
                    contactMethods: {
                      select: {
                        id: true,
                        value: true,
                        method: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        fromCurrency: {
          select: {
            id: true,
            name: true,
            isBegottening: true,
          },
        },
        toCurrency: {
          select: {
            id: true,
            name: true,
            isBegottening: true,
          },
        },
        transactions: {
          select: {
            id: true,
            amountInSelectedCurrency: true,
            checkUrl: true,
            status: true,
            isInCash: true,
            isCompanyTransaction: true,
            senderId: true,
            begottenByCurrencyExchangeId: true,
            currencyExchangeId: true,
          },
        },
        begottenTransactions: {
          select: {
            id: true,
            amountInSelectedCurrency: true,
            checkUrl: true,
            status: true,
            isInCash: true,
            isCompanyTransaction: true,
            senderId: true,
            begottenByCurrencyExchangeId: true,
            currencyExchangeId: true,
          },
        },
      },
    });

    if (!exchange) {
      throw new Error('Currency exchange not found');
    }

    const inProgressTransactionsAmountInSelectedCurrency = exchange.transactions
      .filter(t => !['completed', 'cancelled'].includes(t.status))
      .reduce((sum, t) => sum + Number(t.amountInSelectedCurrency), 0);

    const finishedTransactionsAmountInSelectedCurrency = exchange.transactions
      .filter(t => ['completed'].includes(t.status))
      .reduce((sum, t) => sum + Number(t.amountInSelectedCurrency), 0);

    const inProgressBegottenTransactionsAmountInSelectedCurrency = exchange.begottenTransactions
      .filter(tr => tr.status !== 'completed' && tr.status !== 'cancelled')
      .reduce((acc, tr) => acc + Number(tr.amountInSelectedCurrency), 0);

    const finishedBegottenTransactionsAmountInSelectedCurrency = exchange.begottenTransactions
      .filter(tr => tr.status === 'completed')
      .reduce((acc, tr) => acc + Number(tr.amountInSelectedCurrency), 0);

    return {
      exchange: {
        ...exchange,
        inProgressTransactionsAmountInSelectedCurrency,
        finishedTransactionsAmountInSelectedCurrency,
        inProgressBegottenTransactionsAmountInSelectedCurrency,
        finishedBegottenTransactionsAmountInSelectedCurrency,
      },
    };
  });
