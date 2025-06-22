import { citizenshipReadProcedure } from '../../lib/trpc.js';

export const getAllBlacklistedTrpcRoute = citizenshipReadProcedure.query(async ({ ctx }) => {
  const blacklistedEntries = await ctx.prisma.blacklisted.findMany({
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

  return { blacklistedEntries };
});
