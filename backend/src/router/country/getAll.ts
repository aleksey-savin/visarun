import { countryReadProcedure } from '../../lib/trpc.js';

export const getAllCountriesTrpcRoute = countryReadProcedure.query(async ({ ctx }) => {
  const countries = await ctx.prisma.country.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      favourite: true,
      eVisaAvailable: true,
      multivisaAvailable: true,
      multivisaIsGlobal: true,
      multivisaGlobalExtraCost: true,
      _count: {
        select: {
          cities: true,
          visaFree: true,
          blacklisted: true,
        },
      },
    },
  });

  return { countries };
});
