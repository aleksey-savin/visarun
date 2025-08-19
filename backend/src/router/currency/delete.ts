import { currencyDeleteProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

const zDeleteCurrencyInput = z.object({
  id: z.string().uuid(),
});

export const deleteCurrencyTrpcRoute = currencyDeleteProcedure
  .input(zDeleteCurrencyInput)
  .mutation(async ({ input, ctx }) => {
    // Check if currency exists
    const existingCurrency = await ctx.prisma.currency.findUnique({
      where: { id: input.id },
      include: {
        _count: {
          select: {
            orderPayments: true,
            exchangeRates: true,
          },
        },
      },
    });

    if (!existingCurrency) {
      throw new Error('Currency not found');
    }

    // Check if currency is being used
    if (existingCurrency._count.orderPayments > 0) {
      throw new Error('Cannot delete currency: it is being used in order payments');
    }

    if (existingCurrency._count.exchangeRates > 0) {
      throw new Error('Cannot delete currency: it is being used in exchange rates');
    }

    await ctx.prisma.currency.delete({
      where: { id: input.id },
    });

    return { success: true };
  });
