/*
TODO:
    Add permission in transactionCreateProcedure
 */

import { transactionCreateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zCreateTransactionTrpcInput = z.object({
    amountInSelectedCurrency: z.number().positive().optional(),
    checkUrl: z.string().optional(),
    currencyExchangeId: z.string().uuid(),
    senderId: z.string().uuid().optional(),
    isCompanyTransaction: z.boolean().optional().default(true),
    isInCash: z.boolean().optional().default(false),
    begottenByCurrencyExchangeId: z.string().uuid().optional(),
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
                amountInSelectedCurrencyTo: true,
                minTransactionAmountInSelectedCurrency: true,
                transactions: {
                    select: {
                        amountInSelectedCurrency: true,
                    },
                },
            },
        });

        if (!exchange) {
            throw new Error("CurrencyExchange does not exist");
        }

        // Transactions sum validation (must be smaller than exchange amount)
        if (exchange.amountInSelectedCurrencyTo && input.amountInSelectedCurrency) {
            type Transaction = { amountInSelectedCurrency: string }

            if (exchange.amountInSelectedCurrencyTo < exchange.transactions
                .filter(tr => !!tr.amountInSelectedCurrency)
                .reduce((acc: number, curr: Transaction) => acc + parseInt(curr.amountInSelectedCurrency), 0) + input.amountInSelectedCurrency
            ) {
                throw new Error("Transactions sum must be smaller than exchange amount");
            }
        }

        // Amount validation (must be greater than minTransactionAmount in CurrencyExchange)
        if (input.amountInSelectedCurrency && exchange.minTransactionAmountInSelectedCurrency) {
            if (input.amountInSelectedCurrency < exchange.minTransactionAmountInSelectedCurrency) {
                throw new Error("Amount must be greater than minTransactionAmount in CurrencyExchange");
            }
        }

        if (input.senderId) {
            // Sender existence validation
            const sender = await ctx.prisma.client.findUnique({
                where: { id: input.senderId },
            });

            if (!sender) {
                throw new Error("Sender does not exist");
            }
        }

        const transaction = await ctx.prisma.transaction.create({
            data: {
                amountInSelectedCurrency: input.amountInSelectedCurrency,
                checkUrl: input.checkUrl,
                currencyExchangeId: input.currencyExchangeId,
                begottenByCurrencyExchangeId: input.begottenByCurrencyExchangeId,
                isCompanyTransaction: input.isCompanyTransaction,
                isInCash: input.isInCash,
                senderId: input.senderId,
                createdById: ctx.user.id,
                updatedById: ctx.user.id,
            },
        });

        return {transaction};
    });
