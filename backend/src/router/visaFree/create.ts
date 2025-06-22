import { citizenshipCreateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zCreateVisaFreeTrpcInput = z.object({
  citizenshipId: z.string().uuid(),
  countryId: z.string().uuid(),
  stampDuration: z.number().int().min(1).max(365),
});

export const createVisaFreeTrpcRoute = citizenshipCreateProcedure
  .input(zCreateVisaFreeTrpcInput)
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

    // Check if visa-free entry already exists
    const existingEntry = await ctx.prisma.visaFree.findUnique({
      where: {
        citizenshipId_countryId: {
          citizenshipId: input.citizenshipId,
          countryId: input.countryId,
        },
      },
    });

    if (existingEntry) {
      throw new Error('Visa-free entry already exists for this citizenship-country combination');
    }

    // Check if there's a blacklist entry for this combination
    const blacklistEntry = await ctx.prisma.blacklisted.findUnique({
      where: {
        citizenshipId_countryId: {
          citizenshipId: input.citizenshipId,
          countryId: input.countryId,
        },
      },
    });

    if (blacklistEntry) {
      throw new Error(
        'Cannot create visa-free entry for a blacklisted citizenship-country combination'
      );
    }

    // Create the visa-free entry
    const newVisaFreeEntry = await ctx.prisma.visaFree.create({
      data: {
        citizenshipId: input.citizenshipId,
        countryId: input.countryId,
        stampDuration: input.stampDuration,
      },
      select: {
        citizenshipId: true,
        countryId: true,
        stampDuration: true,
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
      visaFreeEntry: newVisaFreeEntry,
    };
  });
