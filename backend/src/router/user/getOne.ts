import { z } from 'zod';
import { trpc } from '../../lib/trpc.js';

export const getUserTrpcRoute = trpc.procedure
  .input(z.object({ id: z.string() }))
  .query(async ({ ctx, input }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: input.id },
      include: {
        roleAssignments: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
                description: true,
                isActive: true,
              },
            },
          },
          orderBy: {
            assignedAt: 'desc',
          },
        },
        contactMethods: {
          include: {
            method: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });
    if (!user) {
      throw new Error(`User ${input.id} not found`);
    }
    return { user };
  });
