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
    // Check if country name already exists
    const existingCountry = await ctx.prisma.country.findFirst({
      where: {
        name: {
          equals: input.name,
          mode: 'insensitive',
        },
      },
    });

    if (existingCountry) {
      throw new Error('Country name already exists');
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
