import { visaCitizenshipSurchargeReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zGetVisaCitizenshipSurchargesByCountryTrpcInput = z.object({
  countryId: z.string().uuid(),
});

export const getVisaCitizenshipSurchargesByCountryTrpcRoute = visaCitizenshipSurchargeReadProcedure
  .input(zGetVisaCitizenshipSurchargesByCountryTrpcInput)
  .query(async ({ input, ctx }) => {
    // Check if country exists
    const country = await ctx.prisma.country.findUnique({
      where: { id: input.countryId },
    });

    if (!country) {
      throw new Error('Country not found');
    }

    const visaCitizenshipSurcharges = await ctx.prisma.visaCitizenshipSurcharge.findMany({
      where: {
        countryId: input.countryId,
      },
      orderBy: [
        {
          citizenship: {
            name: 'asc',
          },
        },
        {
          visaTypeId: 'asc',
        },
      ],
      select: {
        id: true,
        citizenshipId: true,
        countryId: true,
        visaTypeId: true,
        surchargeAmount: true,
        note: true,
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
          },
        },
      },
    });

    return {
      visaCitizenshipSurcharges,
      country: {
        id: country.id,
        name: country.name,
      },
    };
  });
