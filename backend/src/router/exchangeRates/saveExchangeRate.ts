import { trpc } from '../../lib/trpc.js';
import { z } from 'zod';

export const saveExchangeRateTrpcInput = z.object({
  rubToVnd: z.number().positive(),
  vndToRub: z.number().positive(),
  usdtToVnd: z.number().positive(),
  vndToUsdt: z.number().positive(),
  usdtToRub: z.number().positive(),
  rubToUsdt: z.number().positive(),
});

export const saveExchangeRateTrpcRoute = trpc.procedure
  .input(saveExchangeRateTrpcInput)
  .mutation(async ({ ctx, input }) => {
    // Ensure user is authenticated and is admin or manager
    if (!ctx.user) {
      throw new Error('Authentication required');
    }

    if (ctx.user.role !== 'admin') {
      throw new Error('Not authorized');
    }

    const exchangeRate = await ctx.prisma.exchangeRate.create({
      data: {
        rubToVnd: input.rubToVnd,
        vndToRub: input.vndToRub,
        usdtToVnd: input.usdtToVnd,
        vndToUsdt: input.vndToUsdt,
        usdtToRub: input.usdtToRub,
        rubToUsdt: input.rubToUsdt,
        userId: ctx.user.id,
      },
    });

    return { exchangeRate };
  });
