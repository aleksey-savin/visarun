import { cityDeleteProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zDeleteCityTrpcInput = z.object({
  id: z.string().min(1),
});

export const deleteCityTrpcRoute = cityDeleteProcedure
  .input(zDeleteCityTrpcInput)
  .mutation(async ({ input, ctx }) => {
    const { id } = input;

    // Check if city exists
    const existingCity = await ctx.prisma.city.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        country: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!existingCity) {
      throw new Error('City not found');
    }

    // Delete the city
    await ctx.prisma.city.delete({
      where: { id },
    });

    return {
      success: true,
      message: `City "${existingCity.name}" in ${existingCity.country.name} has been deleted successfully`,
    };
  });
