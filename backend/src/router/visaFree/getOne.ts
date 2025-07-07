import { citizenshipReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zGetOneVisaFreeTrpcInput = z.object({
  citizenshipId: z.string().uuid(),
  countryId: z.string().uuid(),
});

export const getOneVisaFreeTrpcRoute = citizenshipReadProcedure
  .input(zGetOneVisaFreeTrpcInput)
  .query(async ({ input, ctx }) => {
    const visaFreeEntry = await ctx.prisma.visaFree.findUnique({
      where: {
        citizenshipId_countryId: {
          citizenshipId: input.citizenshipId,
          countryId: input.countryId,
        },
      },
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

    if (!visaFreeEntry) {
      throw new Error('Visa-free entry not found');
    }

    return { visaFreeEntry };
  });
