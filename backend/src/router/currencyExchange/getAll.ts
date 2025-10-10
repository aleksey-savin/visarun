/*
TODO:
    1. Check if select object is full
    2. Add permission in currencyExchangeReadProcedure
 */

import { currencyExchangeReadProcedure } from '../../lib/trpc.js';

export const getAllCurrencyExchangesTrpcRoute = currencyExchangeReadProcedure.query(async ({ ctx }) => {
    const exchanges = await ctx.prisma.currencyExchange.findMany({
        orderBy: { deadline: 'asc' },
        select: {
            id: true,
            amount: true,
            amountInSelectedCurrencyFrom: true,
            amountInSelectedCurrencyTo: true,
            status: true,
            deadline: true,
            minTransactionAmount: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    return { exchanges };
});
