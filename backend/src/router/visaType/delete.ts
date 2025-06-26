import { visaTypeDeleteProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zDeleteVisaTypeTrpcInput = z.object({
  id: z.string().uuid(),
});

export const deleteVisaTypeTrpcRoute = visaTypeDeleteProcedure
  .input(zDeleteVisaTypeTrpcInput)
  .mutation(async ({ input, ctx }) => {
    const { id } = input;

    // Check if visa type exists
    const existingVisaType = await ctx.prisma.visaType.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            visaApplications: true,
            clientVisas: true,
          },
        },
      },
    });

    if (!existingVisaType) {
      throw new Error('Visa type not found');
    }

    // Check if visa type has related records
    if (existingVisaType._count.visaApplications > 0) {
      throw new Error('Cannot delete visa type with existing visa applications');
    }

    if (existingVisaType._count.clientVisas > 0) {
      throw new Error('Cannot delete visa type with existing client visas');
    }

    // Delete visa type
    await ctx.prisma.visaType.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Visa type deleted successfully',
    };
  });
