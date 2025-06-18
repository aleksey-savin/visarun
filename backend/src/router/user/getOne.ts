import { z } from 'zod';
import { trpc } from '../../lib/trpc.js';

export const getUserTrpcRoute = trpc.procedure
  .input(z.object({ id: z.string() }))
  .query(async ({ ctx, input }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: input.id },
      include: {
        roleModel: true,
      },
    });
    if (!user) {
      throw new Error(`User ${input.id} not found`);
    }
    return { user };
  });
