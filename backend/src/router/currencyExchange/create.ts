/*
TODO:
    Add permission in currencyExchangeCreateProcedure
 */

import { currencyExchangeCreateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zCreateCurrencyExchangeTrpcInput = z.object({
    exchangeRate: z.number().positive().optional(),
    amountInSelectedCurrencyFrom: z.number().positive().optional(),
    amountInSelectedCurrencyTo: z.number().positive().optional(),
    deadline: z.string().datetime().transform(str => new Date(str)).optional(),
    minTransactionAmountInSelectedCurrency: z.number().positive().optional(),
    orderItemId: z.string().uuid(),
    fromCurrencyId: z.string().uuid().optional(),
    toCurrencyId: z.string().uuid().optional(),
});

export const createCurrencyExchangeTrpcRoute = currencyExchangeCreateProcedure
    .input(zCreateCurrencyExchangeTrpcInput)
    .mutation(async ({ input, ctx }) => {
        if (!ctx.user?.id) {
            throw new Error("User must be authenticated to create a CurrencyExchange");
        }

        // Minimal transaction amount validation (must be lower than amount)
        if (input.minTransactionAmountInSelectedCurrency && input.amountInSelectedCurrencyTo && input.minTransactionAmountInSelectedCurrency > input.amountInSelectedCurrencyTo) {
            throw new Error("Minimal transaction amount must be lower than amount (in selected currency)");
        }

        // Deadline validation (must be later than current time)
        if (input.deadline && input.deadline < new Date()) {
            throw new Error("Deadline must be later than current time");
        }

        // OrderItem existence validation
        const orderItem = await ctx.prisma.orderItem.findUnique({
            where: { id: input.orderItemId },
        });

        if (!orderItem) {
            throw new Error("OrderItem does not exist");
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

        // Calculating new position value
        const max = await ctx.prisma.currencyExchange.aggregate({
            _max: { position: true },
        });

        const newPosition = (max._max.position ?? 0) + 1;

        const exchange = await ctx.prisma.currencyExchange.create({
            data: {
                position: newPosition,
                exchangeRate: input.exchangeRate,
                // amountFrom: input.amountFrom,
                // amountTo: input.amountTo,
                amountInSelectedCurrencyFrom: input.amountInSelectedCurrencyFrom,
                amountInSelectedCurrencyTo: input.amountInSelectedCurrencyTo,
                orderItemId: input.orderItemId,
                fromCurrencyId: input.fromCurrencyId,
                toCurrencyId: input.toCurrencyId,
                createdById: ctx.user.id,
                updatedById: ctx.user.id,
                deadline: input.deadline,
                // minTransactionAmount: input.minTransactionAmount,
                minTransactionAmountInSelectedCurrency: input.minTransactionAmountInSelectedCurrency,
            },
        });

        return exchange;
    });
