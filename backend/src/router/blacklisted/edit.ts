import { citizenshipUpdateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zEditBlacklistedTrpcInput = z.object({
  citizenshipId: z.string().uuid(),
  countryId: z.string().uuid(),
});

export const editBlacklistedTrpcRoute = citizenshipUpdateProcedure
  .input(zEditBlacklistedTrpcInput)
  .mutation(async ({ input, ctx }) => {
    // Check if blacklisted entry exists
    const existingEntry = await ctx.prisma.blacklisted.findUnique({
      where: {
        citizenshipId_countryId: {
          citizenshipId: input.citizenshipId,
          countryId: input.countryId,
        },
      },
    });

    if (!existingEntry) {
      throw new Error('Blacklisted entry not found');
    }

    // Since there are no editable fields in the blacklisted table,
    // we just return the existing entry
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
      blacklistedEntry,
      message: 'Blacklisted entry has no editable fields',
    };
  });
