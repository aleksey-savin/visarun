import { currencyReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

const zGetOneCurrencyInput = z.object({
  id: z.string().uuid(),
});

export const getOneCurrencyTrpcRoute = currencyReadProcedure
  .input(zGetOneCurrencyInput)
  .query(async ({ input, ctx }) => {
    const currency = await ctx.prisma.currency.findUnique({
      where: { id: input.id },
      select: {
        id: true,
        name: true,
        isBegottening: true,
        _count: {
          select: {
            orderPayments: true,
            exchangeRates: true,
            currencyExchangesFrom: true,
            currencyExchangesTo: true,
          },
        },
      },
    });

    if (!currency) {
      throw new Error('Currency not found');
    }

    return { currency };
  });
