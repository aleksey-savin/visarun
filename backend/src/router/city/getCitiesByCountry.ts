import { cityReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zGetCitiesByCountryTrpcInput = z.object({
  countryId: z.string().min(1),
});

export const getCitiesByCountryTrpcRoute = cityReadProcedure
  .input(zGetCitiesByCountryTrpcInput)
  .query(async ({ input, ctx }) => {
    // Check if country exists
    const country = await ctx.prisma.country.findUnique({
      where: { id: input.countryId },
      select: {
        id: true,
        name: true,
      },
    });

    if (!country) {
      throw new Error('Country not found');
    }

    const cities = await ctx.prisma.city.findMany({
      where: {
        countryId: input.countryId,
      },
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

    return {
      cities,
      country,
    };
  });
