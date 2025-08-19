import { currencyUpdateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

const zEditCurrencyInput = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
});

export const editCurrencyTrpcRoute = currencyUpdateProcedure
  .input(zEditCurrencyInput)
  .mutation(async ({ input, ctx }) => {
    // Check if currency exists
    const existingCurrency = await ctx.prisma.currency.findUnique({
      where: { id: input.id },
    });

    if (!existingCurrency) {
      throw new Error('Currency not found');
    }

    // Check if another currency with this name already exists
    const duplicateCurrency = await ctx.prisma.currency.findFirst({
      where: {
        name: {
          equals: input.name,
          mode: 'insensitive',
        },
        id: {
          not: input.id,
        },
      },
    });

    if (duplicateCurrency) {
      throw new Error('A currency with this name already exists');
    }

    const currency = await ctx.prisma.currency.update({
      where: { id: input.id },
      data: {
        name: input.name,
      },
      select: {
        id: true,
        name: true,
      },
    });

    return { currency };
  });
