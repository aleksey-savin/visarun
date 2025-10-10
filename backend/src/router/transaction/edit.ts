/*
TODO:
    1. Add permission in transactionUpdateProcedure
    2. Add amount validation (sum of all transactions with new one must be less or equal than amount in CurrencyExchange)
 */

import { transactionUpdateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zEditTransactionTrpcInput = z.object({
    id: z.string().uuid(),
    amount: z.number().positive(),
    amountInSelectedCurrency: z.number().positive(),
    customExchangeRate: z.boolean(),
    checkUrl: z.string().optional(),
    status: z.enum([
        'draft',
        'in_progress',
        'finished',
        'cancelled',
    ]),
    senderId: z.string().uuid(),
});

export const editTransactionTrpcRoute = transactionUpdateProcedure
    .input(zEditTransactionTrpcInput)
    .mutation(async ({ input, ctx }) => {
        const { id, ...updateData } = input;

        if (!ctx.user?.id) {
            throw new Error("User must be authenticated to edit the Transaction");
        }

        // Check if transaction exists
        const existingTransaction = await ctx.prisma.transaction.findUnique({
            where: { id },
            select: {
                currencyExchange: {
                    select: {
                        amount: true,
                        minTransactionAmount: true,
                        transactions: {
                            where: {
                                id: { not: id }
                            },
                            select: {
                                amount: true,
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
        type Transaction = { amount: string }

        if (existingTransaction.currencyExchange.amount < existingTransaction.currencyExchange.transactions.reduce((acc: number, curr: Transaction) => acc + parseInt(curr.amount), 0) + input.amount) {
            throw new Error("Transactions sum must be smaller than exchange amount");
        }

        // Amount validation (must be greater than minTransactionAmount in CurrencyExchange)
        if (input.amount < existingTransaction.currencyExchange.minTransactionAmount) {
            throw new Error("Amount must be greater than minTransactionAmount in CurrencyExchange");
        }

        // Sender existence validation
        const sender = await ctx.prisma.client.findUnique({
            where: { id: input.senderId },
        });

        if (!sender) {
            throw new Error("Sender does not exist");
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
