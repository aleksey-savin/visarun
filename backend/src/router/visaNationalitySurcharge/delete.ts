import { visaNationalitySurchargeDeleteProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zDeleteVisaNationalitySurchargeTrpcInput = z.object({
  id: z.string().uuid(),
});

export const deleteVisaNationalitySurchargeTrpcRoute = visaNationalitySurchargeDeleteProcedure
  .input(zDeleteVisaNationalitySurchargeTrpcInput)
  .mutation(async ({ input, ctx }) => {
    // Check if visa nationality surcharge exists
    const existingSurcharge = await ctx.prisma.visaNationalitySurcharge.findUnique({
      where: { id: input.id },
    });

    if (!existingSurcharge) {
      throw new Error('Visa nationality surcharge not found');
    }

    // Delete the visa nationality surcharge
    await ctx.prisma.visaNationalitySurcharge.delete({
      where: { id: input.id },
    });

    return {
      success: true,
      message: 'Visa nationality surcharge deleted successfully',
    };
  });
