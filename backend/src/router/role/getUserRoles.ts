import { trpc } from '../../lib/trpc.js';
import { z } from 'zod';

export const zGetUserRolesTrpcInput = z.object({
  userId: z.string().uuid(),
});

export const getUserRolesTrpcRoute = trpc.procedure
  .input(zGetUserRolesTrpcInput)
  .query(async ({ input, ctx }) => {
    // Verify user exists
    const user = await ctx.prisma.user.findUnique({
      where: { id: input.userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Get user role assignments
    const assignments = await ctx.prisma.userRoleAssignment.findMany({
      where: {
        userId: input.userId,
      },
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
    });

    return {
      userId: input.userId,
      roles: assignments.map(assignment => ({
        assignmentId: assignment.id,
        role: assignment.role,
        assignedAt: assignment.assignedAt,
        assignedBy: assignment.assignedBy,
      })),
    };
  });
