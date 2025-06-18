import { adminProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const deleteUserTrpcRoute = adminProcedure
  .input(z.object({ id: z.string() }))
  .mutation(async ({ input, ctx }) => {
    console.log(input.id);
    const existingUser = await ctx.prisma.user.findUnique({
      where: { id: input.id },
    });

    if (!existingUser) {
      throw new Error('User not found');
    }

    await ctx.prisma.user.delete({
      where: { id: input.id },
    });

    return { message: 'User deleted successfully' };
  });
