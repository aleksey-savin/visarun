/*
TODO:
    1. Check if select object is full
    2. Add permission in transactionReadProcedure
    3. REDO or DELETE
 */

import { transactionReadProcedure } from '../../lib/trpc.js';
import { z } from "zod";

export const zGetAllTransactionsByCurrencyExchangeIdTrpcInput = z.object({
    currencyExchangeId: z.string().uuid(),
});

export const getAllTransactionsByCurrencyExchangeIdTrpcRoute = transactionReadProcedure
    .input(zGetAllTransactionsByCurrencyExchangeIdTrpcInput)
    .query(async ({ input, ctx }) => {
        // Check if exchange exists
        const exchange = await ctx.prisma.currencyExchange.findUnique({
            where: { id: input.currencyExchangeId },
        });

        if (!exchange) {
            throw new Error('Currency exchange not found');
        }

        const transactions = await ctx.prisma.transaction.findMany({
            where: { currencyExchangeId: input.currencyExchangeId },
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
