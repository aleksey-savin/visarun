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
    throw new Error('No exchange rates found');
  }

  return { exchangeRate: latestRate };
});
