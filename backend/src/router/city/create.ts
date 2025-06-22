import { cityCreateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zCreateCityTrpcInput = z.object({
  name: z.string().min(1).max(100),
  countryId: z.string().min(1),
  isActive: z.boolean().default(true),
});

export const createCityTrpcRoute = cityCreateProcedure
  .input(zCreateCityTrpcInput)
  .mutation(async ({ input, ctx }) => {
    // Check if country exists
    const country = await ctx.prisma.country.findUnique({
      where: { id: input.countryId },
    });

    if (!country) {
      throw new Error('Country not found');
    }

    // Check if city name already exists in this country
    const existingCity = await ctx.prisma.city.findFirst({
      where: {
        name: {
          equals: input.name,
          mode: 'insensitive',
        },
        countryId: input.countryId,
      },
    });

    if (existingCity) {
      throw new Error('City name already exists in this country');
    }

    // Create the city
    const newCity = await ctx.prisma.city.create({
      data: {
        name: input.name,
        countryId: input.countryId,
        isActive: input.isActive,
      },
      select: {
        id: true,
        name: true,
        isActive: true,
        countryId: true,
        country: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return {
      city: newCity,
    };
  });
