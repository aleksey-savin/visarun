/*
TODO:
    1. Check if select object is full
    2. Add permission in currencyExchangeReadProcedure
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
                amountFrom: true,
                amountTo: true,
                amountInSelectedCurrencyFrom: true,
                amountInSelectedCurrencyTo: true,
                status: true,
                deadline: true,
                minTransactionAmount: true,
                minAmountInSelectedCurrency: true,
                orderItem: {
                    select: {
                        id: true,
                        client: {
                            select: {
                                id: true,
                                userId: true,
                                firstName: true,
                                lastName: true,
                                bankingDetails: {
                                    select: {
                                        id: true,
                                        content: true,
                                        documentUrl: true,
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
                    },
                },
                toCurrency: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                transactions: {
                    select: {
                        id: true,
                        amount: true,
                        amountInSelectedCurrency: true,
                        customExchangeRate: true,
                        checkUrl: true,
                        status: true,
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
                },
            },
        });

        if (!exchange) {
            throw new Error('Currency exchange not found');
        }

        return { exchange };
    });
