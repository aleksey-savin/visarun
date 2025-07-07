import { adminProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const deleteContactMethodTrpcRoute = adminProcedure
  .input(z.object({ id: z.string().uuid() }))
  .mutation(async ({ input, ctx }) => {
    // Verify contact method exists
    const existingContactMethod = await ctx.prisma.contactMethod.findUnique({
      where: { id: input.id },
      include: {
        assignments: true,
      },
    });

    if (!existingContactMethod) {
      throw new Error('Contact method not found');
    }

    // Check if contact method is in use
    if (existingContactMethod.assignments.length > 0) {
      throw new Error(
        'Cannot delete contact method that is currently assigned to users. Remove all assignments first.'
      );
    }

    // Delete the contact method
    await ctx.prisma.contactMethod.delete({
      where: { id: input.id },
    });

    return {
      success: true,
      message: 'Contact method deleted successfully',
    };
  });
