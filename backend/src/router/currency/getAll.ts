import { currencyReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

const zGetAllCurrenciesInput = z.object({
  search: z.string().optional(),
  limit: z.number().min(1).max(100).default(50).optional(),
  offset: z.number().min(0).default(0).optional(),
});

export const getAllCurrenciesTrpcRoute = currencyReadProcedure
  .input(zGetAllCurrenciesInput)
  .query(async ({ input, ctx }) => {
    const { search, limit = 50, offset = 0 } = input;

    const where = search
      ? {
          name: {
            contains: search,
            mode: 'insensitive' as const,
          },
        }
      : {};

    const [currencies, total] = await Promise.all([
      ctx.prisma.currency.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          _count: {
            select: {
              orderPayments: true,
              exchangeRates: true,
                currencyExchangesFrom: true,
                currencyExchangesTo: true,
            },
          },
        },
      }),
      ctx.prisma.currency.count({ where }),
    ]);

    return {
      currencies,
      total,
      hasMore: offset + limit < total,
    };
  });
