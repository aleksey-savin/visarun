import { cityReadProcedure } from '../../lib/trpc.js';

export const getAllCitiesTrpcRoute = cityReadProcedure.query(async ({ ctx }) => {
  const cities = await ctx.prisma.city.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      isActive: true,
      country: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return { cities };
});
