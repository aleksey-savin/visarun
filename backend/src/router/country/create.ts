import { countryCreateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zCreateCountryTrpcInput = z.object({
  name: z.string().min(1).max(100),
  eVisaAvailable: z.boolean().default(false),
  multivisaAvailable: z.boolean().default(false),
});

export const createCountryTrpcRoute = countryCreateProcedure
  .input(zCreateCountryTrpcInput)
  .mutation(async ({ input, ctx }) => {
    // Normalize the input name for duplicate checking
    const normalizedInputName = input.name.toLowerCase().trim().replace(/\s+/g, '');

    // Get all existing countries to check for normalized duplicates
    const existingCountries = await ctx.prisma.country.findMany({
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

    // Create the country
    const newCountry = await ctx.prisma.country.create({
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
      country: newCountry,
    };
  });
