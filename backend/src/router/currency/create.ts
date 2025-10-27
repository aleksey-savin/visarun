import { currencyCreateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

const zCreateCurrencyInput = z.object({
  name: z.string().min(1).max(100),
  isBegottening: z.boolean().optional(),
});

export const createCurrencyTrpcRoute = currencyCreateProcedure
  .input(zCreateCurrencyInput)
  .mutation(async ({ input, ctx }) => {
    // Check if currency with this name already exists
    const existingCurrency = await ctx.prisma.currency.findFirst({
      where: {
        name: {
          equals: input.name,
          mode: 'insensitive',
        },
      },
    });

    if (existingCurrency) {
      throw new Error('A currency with this name already exists');
    }

    const currency = await ctx.prisma.currency.create({
      data: {
        name: input.name,
        isBegottening: input.isBegottening
      },
      select: {
        id: true,
        name: true,
      },
    });

    return { currency };
  });
