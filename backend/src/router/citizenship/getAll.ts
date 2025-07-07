import { citizenshipReadProcedure } from '../../lib/trpc.js';

export const getAllCitizenshipsTrpcRoute = citizenshipReadProcedure.query(async ({ ctx }) => {
  const citizenships = await ctx.prisma.citizenship.findMany({
    orderBy: [{ favourite: 'desc' }, { name: 'asc' }],
    select: {
      id: true,
      name: true,
      favourite: true,
      _count: {
        select: {
          visaFree: true,
          blacklisted: true,
          surcharges: true,
        },
      },
    },
  });

  return { citizenships };
});
