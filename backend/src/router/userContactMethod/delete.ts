import { userUpdateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const deleteUserContactMethodTrpcRoute = userUpdateProcedure
  .input(z.object({ id: z.string().uuid() }))
  .mutation(async ({ input, ctx }) => {
    // Verify user contact method exists
    const existingUserContactMethod = await ctx.prisma.userContactMethod.findUnique({
      where: { id: input.id },
    });

    if (!existingUserContactMethod) {
      throw new Error('User contact method not found');
    }

    // Delete the user contact method
    await ctx.prisma.userContactMethod.delete({
      where: { id: input.id },
    });

    return {
      success: true,
      message: 'User contact method deleted successfully',
    };
  });
