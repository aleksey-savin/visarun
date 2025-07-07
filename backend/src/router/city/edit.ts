import { cityUpdateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zEditCityTrpcInput = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100),
  countryId: z.string().min(1),
  isActive: z.boolean(),
});

export const editCityTrpcRoute = cityUpdateProcedure
  .input(zEditCityTrpcInput)
  .mutation(async ({ input, ctx }) => {
    const { id, ...updateData } = input;

    // Check if city exists
    const existingCity = await ctx.prisma.city.findUnique({
      where: { id },
    });

    if (!existingCity) {
      throw new Error('City not found');
    }

    // Check if country exists
    const country = await ctx.prisma.country.findUnique({
      where: { id: updateData.countryId },
    });

    if (!country) {
      throw new Error('Country not found');
    }

    // Check if city name already exists in this country (excluding current city)
    const duplicateCity = await ctx.prisma.city.findFirst({
      where: {
        name: {
          equals: updateData.name,
          mode: 'insensitive',
        },
        countryId: updateData.countryId,
        id: {
          not: id,
        },
      },
    });

    if (duplicateCity) {
      throw new Error('City name already exists in this country');
    }

    // Update the city
    const updatedCity = await ctx.prisma.city.update({
      where: { id },
      data: updateData,
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
      city: updatedCity,
    };
  });
