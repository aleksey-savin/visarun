import { countryUpdateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zEditCountryTrpcInput = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  eVisaAvailable: z.boolean(),
  multivisaAvailable: z.boolean(),
});

export const editCountryTrpcRoute = countryUpdateProcedure
  .input(zEditCountryTrpcInput)
  .mutation(async ({ input, ctx }) => {
    // Check if country exists
    const existingCountry = await ctx.prisma.country.findUnique({
      where: { id: input.id },
    });

    if (!existingCountry) {
      throw new Error('Country not found');
    }

    // Check if another country with the same name exists (excluding current one)
    const duplicateCountry = await ctx.prisma.country.findFirst({
      where: {
        name: {
          equals: input.name,
          mode: 'insensitive',
        },
        id: {
          not: input.id,
        },
      },
    });

    if (duplicateCountry) {
      throw new Error('Country name already exists');
    }

    // Update the country
    const updatedCountry = await ctx.prisma.country.update({
      where: { id: input.id },
      data: {
        name: input.name,
        eVisaAvailable: input.eVisaAvailable,
        multivisaAvailable: input.multivisaAvailable,
      },
      select: {
        id: true,
        name: true,
        eVisaAvailable: true,
        multivisaAvailable: true,
      },
    });

    return {
      country: updatedCountry,
    };
  });
