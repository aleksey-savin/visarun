import { citizenshipReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zGetOneBlacklistedTrpcInput = z.object({
  citizenshipId: z.string().uuid(),
  countryId: z.string().uuid(),
});

export const getOneBlacklistedTrpcRoute = citizenshipReadProcedure
  .input(zGetOneBlacklistedTrpcInput)
  .query(async ({ input, ctx }) => {
    const blacklistedEntry = await ctx.prisma.blacklisted.findUnique({
      where: {
        citizenshipId_countryId: {
          citizenshipId: input.citizenshipId,
          countryId: input.countryId,
        },
      },
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

    if (!blacklistedEntry) {
      throw new Error('Blacklisted entry not found');
    }

    return { blacklistedEntry };
  });
