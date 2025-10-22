import { currencyExchangeReadProcedure } from '../../lib/trpc.ts';
import {string} from "zod";

export const getAllCurrencyExchangeCombinationsTrpcRoute = currencyExchangeReadProcedure
    .query(async ({ ctx }) => {
        const exchanges = await ctx.prisma.currencyExchange.findMany({
            select: {
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
            },
        });

        type CurrencyExchange = {
            fromCurrency: {
                id: string,
                name: string,
            };
            toCurrency: {
                id: string,
                name: string,
            };
        }

        const uniquePairs = new Set<string>(
            exchanges.map(
                (e: CurrencyExchange) => `${e.fromCurrency.id}|${e.fromCurrency.name}_${e.toCurrency.id}|${e.toCurrency.name}`
            )
        );

        const result = Array
            .from(uniquePairs)
            .map((pair) => {
                const [fromCurrency, toCurrency] = pair.split('_');
                const [fromCurrencyId, fromCurrencyName] = fromCurrency.split('|');
                const [toCurrencyId, toCurrencyName] = toCurrency.split('|');

                return {
                    fromCurrency: {
                        id: fromCurrencyId,
                        name: fromCurrencyName,
                    },
                    toCurrency: {
                        id: toCurrencyId,
                        name: toCurrencyName,
                    }
                };
            });

        return {
            combinations: Array.from(result)
        };
    });
