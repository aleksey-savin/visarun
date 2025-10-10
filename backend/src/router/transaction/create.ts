/*
TODO:
    1. Add permission in transactionCreateProcedure
    2. Add amount validation (sum of all transactions with new one must be less or equal than amount in CurrencyExchange)
 */

import { transactionCreateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zCreateTransactionTrpcInput = z.object({
    amount: z.number().positive(),
    amountInSelectedCurrency: z.number().positive(),
    customExchangeRate: z.boolean().optional().default(false),
    checkUrl: z.string().optional(),
    currencyExchangeId: z.string().uuid(),
    senderId: z.string().uuid(),
});

export const createTransactionTrpcRoute = transactionCreateProcedure
    .input(zCreateTransactionTrpcInput)
    .mutation(async ({ input, ctx }) => {
        if (!ctx.user?.id) {
            throw new Error("User must be authenticated to create a Transaction");
        }

        // CurrencyExchange existence validation
        const exchange = await ctx.prisma.currencyExchange.findUnique({
            where: { id: input.currencyExchangeId },
            select: {
                amount: true,
                minTransactionAmount: true,
                transactions: {
                    select: {
                        amount: true,
                    },
                },
            },
        });

        if (!exchange) {
            throw new Error("CurrencyExchange does not exist");
        }

        // Transactions sum validation (must be smaller than exchange amount)
        type Transaction = { amount: string }

        if (exchange.amount < exchange.transactions.reduce((acc: number, curr: Transaction) => acc + parseInt(curr.amount), 0) + input.amount) {
            throw new Error("Transactions sum must be smaller than exchange amount");
        }

        // Amount validation (must be greater than minTransactionAmount in CurrencyExchange)
        if (input.amount < exchange.minTransactionAmount) {
            throw new Error("Amount must be greater than minTransactionAmount in CurrencyExchange");
        }

        // Sender existence validation
        const sender = await ctx.prisma.client.findUnique({
            where: { id: input.senderId },
        });

        if (!sender) {
            throw new Error("Sender does not exist");
        }

        const transaction = await ctx.prisma.transaction.create({
            data: {
                amount: input.amount,
                amountInSelectedCurrency: input.amountInSelectedCurrency,
                customExchangeRate: input.customExchangeRate,
                checkUrl: input.checkUrl,
                currencyExchangeId: input.currencyExchangeId,
                senderId: input.senderId,
                createdById: ctx.user.id,
                updatedById: ctx.user.id,
            },
        });

        return transaction;
    });
