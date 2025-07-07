import { citizenshipDeleteProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zDeleteCitizenshipTrpcInput = z.object({
  id: z.string().uuid(),
});

export const deleteCitizenshipTrpcRoute = citizenshipDeleteProcedure
  .input(zDeleteCitizenshipTrpcInput)
  .mutation(async ({ input, ctx }) => {
    // Check if citizenship exists
    const existingCitizenship = await ctx.prisma.citizenship.findUnique({
      where: { id: input.id },
      include: {
        visaFree: true,
        blacklisted: true,
        surcharges: true,
      },
    });

    if (!existingCitizenship) {
      throw new Error('Citizenship not found');
    }

    // Check if citizenship has related data
    const hasRelatedData =
      existingCitizenship.visaFree.length > 0 ||
      existingCitizenship.blacklisted.length > 0 ||
      existingCitizenship.surcharges.length > 0;

    if (hasRelatedData) {
      throw new Error(
        'Cannot delete citizenship with related visa-free entries, blacklist entries, or surcharges. Please remove related data first.'
      );
    }

    // Delete the citizenship
    await ctx.prisma.citizenship.delete({
      where: { id: input.id },
    });

    return {
      success: true,
      message: 'Citizenship deleted successfully',
    };
  });
