/*
TODO:
    1. Add permission in currencyExchangeUpdateProcedure
    2. Add transactions validation after edit
 */

import { currencyExchangeUpdateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zEditCurrencyExchangeTrpcInput = z.object({
    id: z.string().uuid(),
    exchangeRate: z.number().positive().optional(),
    amountInSelectedCurrencyFrom: z.number().positive().optional(),
    amountInSelectedCurrencyTo: z.number().positive().optional(),
    deadline: z.string().datetime().transform(str => new Date(str)).optional(),
    minTransactionAmountInSelectedCurrency: z.number().positive().optional(),
    fromCurrencyId: z.string().uuid().optional(),
    toCurrencyId: z.string().uuid().optional(),
});

export const editCurrencyExchangeTrpcRoute = currencyExchangeUpdateProcedure
    .input(zEditCurrencyExchangeTrpcInput)
    .mutation(async ({ input, ctx }) => {
        const { id, ...updateData } = input;

        if (!ctx.user?.id) {
            throw new Error("User must be authenticated to edit the CurrencyExchange");
        }

        // Check if exchange exists
        const existingExchange = await ctx.prisma.currencyExchange.findUnique({
            where: { id },
            include: {
                transactions: true,
            }
        });

        if (!existingExchange) {
            throw new Error('Currency exchange not found');
        }

        // AmountTo validation (must be greater than transactions sum)
        type Transaction = { amountInSelectedCurrency: number }

        if (input.amountInSelectedCurrencyTo && input.amountInSelectedCurrencyTo < existingExchange.transactions.reduce((acc: number, curr: Transaction) => acc + curr.amountInSelectedCurrency, 0)) {
            throw new Error("Transactions sum must be smaller than exchange amountTo (in selected currency)");
        }

        // Minimal transaction amount validation (must be lower than amountTo)
        const minTransactionAmountInSelectedCurrency = input.minTransactionAmountInSelectedCurrency || existingExchange.minTransactionAmountInSelectedCurrency;
        if (minTransactionAmountInSelectedCurrency && input.amountInSelectedCurrencyTo && minTransactionAmountInSelectedCurrency > input.amountInSelectedCurrencyTo) {
            throw new Error("Minimal transaction amount must be lower than amountTo (in selected currency)");
        }

        // Deadline validation (must be later than creation time)
        if (input.deadline && input.deadline < existingExchange.createdAt) {
            throw new Error("Deadline must be later than creation time");
        }

        // FromCurrency existence validation
        if (input.fromCurrencyId) {
            const fromCurrency = await ctx.prisma.currency.findUnique({
                where: { id: input.fromCurrencyId },
            });

            if (!fromCurrency) {
                throw new Error("FromCurrency does not exist");
            }
        }

        // ToCurrency existence validation
        if (input.toCurrencyId) {
            const toCurrency = await ctx.prisma.currency.findUnique({
                where: { id: input.toCurrencyId },
            });

            if (!toCurrency) {
                throw new Error("ToCurrency does not exist");
            }
        }

        // Update exchange
        const exchange = await ctx.prisma.currencyExchange.update({
            where: { id },
            data: {
                ...updateData,
                updatedById: ctx.user.id,
            },
        });

        return { exchange };
    });
