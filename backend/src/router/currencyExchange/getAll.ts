/*
TODO:
    Add permission in currencyExchangeReadProcedure
 */

import { currencyExchangeReadProcedure } from '../../lib/trpc.js';
import {z} from "zod";
import {Prisma} from "@prisma/client";

export const zGetAllCurrencyExchangesTrpcInput = z.object({
    status: z.enum([
        'draft',
        'in_progress',
        'finished',
        'cancelled',
    ]).optional(),
    fromCurrencyId: z.string().optional(),
    toCurrencyId: z.string().optional(),
    search: z.string().optional(),
    limit: z.number().min(1).max(200).optional().default(100),
    offset: z.number().min(0).optional().default(0),
    sortBy: z.enum(['position', 'inProgress', 'remains', 'minTransactionAmount', 'deadline']).optional().default('position'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

export const getAllCurrencyExchangesTrpcRoute = currencyExchangeReadProcedure
    .input(zGetAllCurrencyExchangesTrpcInput)
    .query(async ({ input, ctx }) => {

        const whereClause: Prisma.CurrencyExchangeWhereInput = {
            AND: []
        };

        // Filter by from currency
        if (input.fromCurrencyId) {
            whereClause.AND.push({
                fromCurrencyId: input.fromCurrencyId
            });
        }

        // Filter by to currency
        if (input.toCurrencyId) {
            whereClause.AND.push({
                toCurrencyId: input.toCurrencyId
            });
        }

        // Filter by status
        if (input.status) {
            whereClause.AND.push({
                status: input.status,
            });
        }

        // Search functionality
        if (input.search) {
            const searchTerm = input.search.toLowerCase();
            const searchNumber = Number(searchTerm);

            whereClause.AND.push(
                {
                    OR: [
                        ...(isNaN(searchNumber)
                            ? []
                            : [{ position: searchNumber }]),
                        {
                            orderItem: {
                                client: {
                                    firstName: {
                                        contains: searchTerm,
                                        mode: 'insensitive',
                                    },
                                },
                            },
                        },
                        {
                            orderItem: {
                                client: {
                                    lastName: {
                                        contains: searchTerm,
                                        mode: 'insensitive',
                                    },
                                },
                            },
                        },
                    ]
                }
            );
        }

        // Build order by clause
        const orderBy: Record<string, 'asc' | 'desc'> = {};

        if (['position', 'minTransactionAmount', 'deadline'].includes(input.sortBy)) {
            orderBy[input.sortBy] = input.sortOrder;
        }

        console.log(whereClause);

        const exchanges = await ctx.prisma.currencyExchange.findMany({
            orderBy,
            where: whereClause,
            select: {
                id: true,
                position: true,
                amountFrom: true,
                amountTo: true,
                amountInSelectedCurrencyFrom: true,
                amountInSelectedCurrencyTo: true,
                status: true,
                deadline: true,
                minTransactionAmount: true,
                minTransactionAmountInSelectedCurrency: true,
                createdAt: true,
                updatedAt: true,
                orderItem: {
                    select: {
                        client: {
                            select: {
                                firstName: true,
                                lastName: true,
                            }
                        }
                    }
                },
                fromCurrency: {
                    select: {
                        name: true,
                    }
                },
                toCurrency: {
                    select: {
                        name: true,
                    }
                },
                transactions: {
                    select: {
                        amount: true,
                        amountInSelectedCurrency: true,
                        status: true,
                    },
                },
            },
        });

        let finalExchanges = exchanges.map((ex) => {
            const inProgressTransactionsAmountInSelectedCurrency = ex.transactions
                .filter((t) => t.status === 'in_progress')
                .reduce((sum, t) => sum + Number(t.amountInSelectedCurrency), 0);

            const finishedTransactionsAmountInSelectedCurrency = ex.transactions
                .filter((t) => t.status === 'finished')
                .reduce((sum, t) => sum + Number(t.amountInSelectedCurrency), 0);

            return {
                ...ex,
                inProgressTransactionsAmountInSelectedCurrency,
                finishedTransactionsAmountInSelectedCurrency,
            };
        });

        if (input.sortBy === 'inProgress') {
            finalExchanges = [...finalExchanges].sort(
                (a, b) => input.sortOrder === 'asc'
                    ? a.inProgressTransactionsAmountInSelectedCurrency - b.inProgressTransactionsAmountInSelectedCurrency
                    : b.inProgressTransactionsAmountInSelectedCurrency - a.inProgressTransactionsAmountInSelectedCurrency
            );
        } else if (input.sortBy === 'remains') {
            finalExchanges = [...finalExchanges].sort(
                (a, b) => {
                    const aRemains = (a.amountInSelectedCurrencyTo ?? 0) - a.finishedTransactionsAmountInSelectedCurrency;
                    const bRemains = (b.amountInSelectedCurrencyTo ?? 0) - b.finishedTransactionsAmountInSelectedCurrency;
                    return input.sortOrder === 'asc' ? aRemains - bRemains : bRemains - aRemains;
                }
            );
        }

        return {
            currencyExchanges: finalExchanges,
        };
});
