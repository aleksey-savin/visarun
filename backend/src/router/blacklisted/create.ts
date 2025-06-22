import { citizenshipCreateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zCreateBlacklistedTrpcInput = z.object({
  citizenshipId: z.string().uuid(),
  countryId: z.string().uuid(),
});

export const createBlacklistedTrpcRoute = citizenshipCreateProcedure
  .input(zCreateBlacklistedTrpcInput)
  .mutation(async ({ input, ctx }) => {
    // Check if citizenship exists
    const citizenship = await ctx.prisma.citizenship.findUnique({
      where: { id: input.citizenshipId },
    });

    if (!citizenship) {
      throw new Error('Citizenship not found');
    }

    // Check if country exists
    const country = await ctx.prisma.country.findUnique({
      where: { id: input.countryId },
    });

    if (!country) {
      throw new Error('Country not found');
    }

    // Check if blacklisted entry already exists
    const existingEntry = await ctx.prisma.blacklisted.findUnique({
      where: {
        citizenshipId_countryId: {
          citizenshipId: input.citizenshipId,
          countryId: input.countryId,
        },
      },
    });

    if (existingEntry) {
      throw new Error('Blacklisted entry already exists for this citizenship-country combination');
    }

    // Check if there's a visa-free entry for this combination
    const visaFreeEntry = await ctx.prisma.visaFree.findUnique({
      where: {
        citizenshipId_countryId: {
          citizenshipId: input.citizenshipId,
          countryId: input.countryId,
        },
      },
    });

    if (visaFreeEntry) {
      throw new Error(
        'Cannot create blacklisted entry for a visa-free citizenship-country combination'
      );
    }

    // Create the blacklisted entry
    const newBlacklistedEntry = await ctx.prisma.blacklisted.create({
      data: {
        citizenshipId: input.citizenshipId,
        countryId: input.countryId,
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
      blacklistedEntry: newBlacklistedEntry,
    };
  });
