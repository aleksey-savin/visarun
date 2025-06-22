import { citizenshipDeleteProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zDeleteVisaFreeTrpcInput = z.object({
  citizenshipId: z.string().uuid(),
  countryId: z.string().uuid(),
});

export const deleteVisaFreeTrpcRoute = citizenshipDeleteProcedure
  .input(zDeleteVisaFreeTrpcInput)
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

    // Delete the visa-free entry
    await ctx.prisma.visaFree.delete({
      where: {
        citizenshipId_countryId: {
          citizenshipId: input.citizenshipId,
          countryId: input.countryId,
        },
      },
    });

    return {
      success: true,
      message: 'Visa-free entry deleted successfully',
    };
  });
