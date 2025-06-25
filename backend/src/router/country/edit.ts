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

    // Normalize the input name for duplicate checking
    const normalizedInputName = input.name.toLowerCase().trim().replace(/\s+/g, '');

    // Get all existing countries to check for normalized duplicates (excluding current one)
    const existingCountries = await ctx.prisma.country.findMany({
      where: {
        id: {
          not: input.id,
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

    // Check if a country with the same normalized name already exists
    const isDuplicate = existingCountries.some(country => {
      const normalizedExistingName = country.name.toLowerCase().trim().replace(/\s+/g, '');
      return normalizedExistingName === normalizedInputName;
    });

    if (isDuplicate) {
      throw new Error(
        'A country with this name already exists (case and spacing variations ignored)'
      );
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
