/*
TODO:
    1. Check if select object is full
    2. Add permission in transactionReadProcedure
    3. REDO
 */

import { transactionReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zGetOneTransactionTrpcInput = z.object({
  id: z.string().uuid(),
});

export const getOneTransactionTrpcRoute = transactionReadProcedure
  .input(zGetOneTransactionTrpcInput)
  .query(async ({ input, ctx }) => {
    const transaction = await ctx.prisma.transaction.findUnique({
      where: { id: input.id },
      select: {
        id: true,
        amount: true,
        amountInSelectedCurrency: true,
        // customExchangeRate: true,
        checkUrl: true,
        status: true,
        currencyExchange: {
          select: {
            id: true,
          },
        },
        sender: {
          select: {
            id: true,
            userId: true,
            firstName: true,
            lastName: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            middleName: true,
            lastName: true,
          },
        },
        updatedBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            middleName: true,
            lastName: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    return { transaction };
  });
