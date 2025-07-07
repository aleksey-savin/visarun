import { citizenshipDeleteProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zDeleteBlacklistedTrpcInput = z.object({
  citizenshipId: z.string().uuid(),
  countryId: z.string().uuid(),
});

export const deleteBlacklistedTrpcRoute = citizenshipDeleteProcedure
  .input(zDeleteBlacklistedTrpcInput)
  .mutation(async ({ input, ctx }) => {
    // Check if blacklisted entry exists
    const existingEntry = await ctx.prisma.blacklisted.findUnique({
      where: {
        citizenshipId_countryId: {
          citizenshipId: input.citizenshipId,
          countryId: input.countryId,
        },
      },
    });

    if (!existingEntry) {
      throw new Error('Blacklisted entry not found');
    }

    // Delete the blacklisted entry
    await ctx.prisma.blacklisted.delete({
      where: {
        citizenshipId_countryId: {
          citizenshipId: input.citizenshipId,
          countryId: input.countryId,
        },
      },
    });

    return {
      success: true,
      message: 'Blacklisted entry deleted successfully',
    };
  });
