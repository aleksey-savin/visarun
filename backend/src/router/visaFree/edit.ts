import { citizenshipUpdateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zEditVisaFreeTrpcInput = z.object({
  citizenshipId: z.string().uuid(),
  countryId: z.string().uuid(),
  stampDuration: z.number().int().min(1).max(365),
});

export const editVisaFreeTrpcRoute = citizenshipUpdateProcedure
  .input(zEditVisaFreeTrpcInput)
  .mutation(async ({ input, ctx }) => {
    // Check if visa-free entry exists
    const existingEntry = await ctx.prisma.visaFree.findUnique({
      where: {
        citizenshipId_countryId: {
          citizenshipId: input.citizenshipId,
          countryId: input.countryId,
        },
      },
    });

    if (!existingEntry) {
      throw new Error('Visa-free entry not found');
    }

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

    // Update the visa-free entry
    const updatedVisaFreeEntry = await ctx.prisma.visaFree.update({
      where: {
        citizenshipId_countryId: {
          citizenshipId: input.citizenshipId,
          countryId: input.countryId,
        },
      },
      data: {
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
      visaFreeEntry: updatedVisaFreeEntry,
    };
  });
