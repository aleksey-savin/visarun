import { trpc } from '../../lib/trpc.js';

export const getLatestExchangeRateTrpcRoute = trpc.procedure.query(async ({ ctx }) => {
  const latestRate = await ctx.prisma.exchangeRate.findFirst({
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      createdBy: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  if (!latestRate) {
    // Return null instead of throwing an error when no rates exist
    return { exchangeRate: null };
  }

  return { exchangeRate: latestRate };
});
