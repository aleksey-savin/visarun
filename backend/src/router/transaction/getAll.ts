/*
TODO:
    1. Check if select object is full
    2. Add permission in transactionReadProcedure
 */

import { transactionReadProcedure } from '../../lib/trpc.js';

export const getAllTransactionsTrpcRoute = transactionReadProcedure.query(async ({ ctx }) => {
    const transactions = await ctx.prisma.transaction.findMany({
        orderBy: { createdAt: 'asc' },
        select: {
            id: true,
            amount: true,
            amountInSelectedCurrency: true,
            customExchangeRate: true,
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

    return { transactions };
});
