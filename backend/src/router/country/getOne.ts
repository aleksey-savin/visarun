import { countryReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zGetOneCountryTrpcInput = z.object({
  id: z.string().uuid(),
});

export const getOneCountryTrpcRoute = countryReadProcedure
  .input(zGetOneCountryTrpcInput)
  .query(async ({ input, ctx }) => {
    const country = await ctx.prisma.country.findUnique({
      where: { id: input.id },
      select: {
        id: true,
        name: true,
        eVisaAvailable: true,
        multivisaAvailable: true,
        cities: {
          select: {
            id: true,
            name: true,
            isActive: true,
          },
          orderBy: { name: 'asc' },
        },
        visaFree: {
          select: {
            citizenshipId: true,
            stampDuration: true,
            citizenship: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        blacklisted: {
          select: {
            citizenshipId: true,
            citizenship: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!country) {
      throw new Error('Country not found');
    }

    return { country };
  });
