import { countryDeleteProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zDeleteCountryTrpcInput = z.object({
  id: z.string().uuid(),
});

export const deleteCountryTrpcRoute = countryDeleteProcedure
  .input(zDeleteCountryTrpcInput)
  .mutation(async ({ input, ctx }) => {
    // Check if country exists
    const existingCountry = await ctx.prisma.country.findUnique({
      where: { id: input.id },
      include: {
        cities: true,
        visaFree: true,
        blacklisted: true,
      },
    });

    if (!existingCountry) {
      throw new Error('Country not found');
    }

    // Check if country has related data
    const hasRelatedData =
      existingCountry.cities.length > 0 ||
      existingCountry.visaFree.length > 0 ||
      existingCountry.blacklisted.length > 0;

    if (hasRelatedData) {
      throw new Error(
        'Cannot delete country with related cities, visa-free entries, or blacklist entries. Please remove related data first.'
      );
    }

    // Delete the country
    await ctx.prisma.country.delete({
      where: { id: input.id },
    });

    return {
      success: true,
      message: 'Country deleted successfully',
    };
  });
