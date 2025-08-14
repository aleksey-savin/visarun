import { z } from 'zod';
import { userReadProcedure } from '../../lib/trpc.js';

export const getUserContactMethodsTrpcRoute = userReadProcedure
  .input(z.object({ userId: z.string().uuid() }))
  .query(async ({ ctx, input }) => {
    // Verify user exists
    const user = await ctx.prisma.user.findUnique({
      where: { id: input.userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const userContactMethods = await ctx.prisma.userContactMethod.findMany({
      where: { userId: input.userId },
      include: {
        method: {
          select: {
            id: true,
            name: true,
            icon: true,
            description: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return { userContactMethods };
  });
