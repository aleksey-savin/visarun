import { citizenshipReadProcedure } from '../../lib/trpc.js';

export const getAllVisaFreeTrpcRoute = citizenshipReadProcedure.query(async ({ ctx }) => {
  const visaFreeEntries = await ctx.prisma.visaFree.findMany({
    orderBy: [
      {
        citizenship: {
          name: 'asc',
        },
      },
      {
        country: {
          name: 'asc',
        },
      },
    ],
    select: {
      citizenshipId: true,
      countryId: true,
      stampDuration: true,
      citizenship: {
        select: {
          id: true,
          name: true,
          favourite: true,
        },
      },
      country: {
        select: {
          id: true,
          name: true,
          eVisaAvailable: true,
          multivisaAvailable: true,
        },
      },
    },
  });

  return { visaFreeEntries };
});
