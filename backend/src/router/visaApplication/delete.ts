import { visaApplicationDeleteProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zDeleteVisaApplicationTrpcInput = z.object({
  id: z.string().uuid(),
});

export const deleteVisaApplicationTrpcRoute = visaApplicationDeleteProcedure
  .input(zDeleteVisaApplicationTrpcInput)
  .mutation(async ({ input, ctx }) => {
    const { id } = input;

    // Check if visa application exists
    const existingApplication = await ctx.prisma.visaApplication.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            clientVisas: true,
          },
        },
      },
    });

    if (!existingApplication) {
      throw new Error('Visa application not found');
    }

    // Check if visa application has related client visas
    if (existingApplication._count.clientVisas > 0) {
      throw new Error('Cannot delete visa application with existing client visas');
    }

    // Check if application is in a state that allows deletion
    const nonDeletableStatuses = ['approved'];
    if (nonDeletableStatuses.includes(existingApplication.status)) {
      throw new Error(`Cannot delete visa application with status: ${existingApplication.status}`);
    }

    // Delete visa application
    await ctx.prisma.visaApplication.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Visa application deleted successfully',
    };
  });
