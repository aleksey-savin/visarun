import { visaCitizenshipSurchargeDeleteProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zDeleteVisaCitizenshipSurchargeTrpcInput = z.object({
  id: z.string().uuid(),
});

export const deleteVisaCitizenshipSurchargeTrpcRoute = visaCitizenshipSurchargeDeleteProcedure
  .input(zDeleteVisaCitizenshipSurchargeTrpcInput)
  .mutation(async ({ input, ctx }) => {
    // Check if visa citizenship surcharge exists
    const existingSurcharge = await ctx.prisma.visaCitizenshipSurcharge.findUnique({
      where: { id: input.id },
    });

    if (!existingSurcharge) {
      throw new Error('Visa citizenship surcharge not found');
    }

    // Delete the visa citizenship surcharge
    await ctx.prisma.visaCitizenshipSurcharge.delete({
      where: { id: input.id },
    });

    return {
      success: true,
      message: 'Visa citizenship surcharge deleted successfully',
    };
  });
