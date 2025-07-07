import { roleAssignProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zAssignUserRoleTrpcInput = z.object({
  userId: z.string().uuid(),
  roleId: z.string().uuid(),
  assignedBy: z.string().uuid().optional(),
});

export const assignUserRoleTrpcRoute = roleAssignProcedure
  .input(zAssignUserRoleTrpcInput)
  .mutation(async ({ input, ctx }) => {
    // Verify user exists
    const user = await ctx.prisma.user.findUnique({
      where: { id: input.userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Verify role exists
    const role = await ctx.prisma.role.findUnique({
      where: { id: input.roleId },
    });

    if (!role) {
      throw new Error('Role not found');
    }

    // Check if role is already assigned to user
    const existingAssignment = await ctx.prisma.userRoleAssignment.findFirst({
      where: {
        userId: input.userId,
        roleId: input.roleId,
      },
    });

    if (existingAssignment) {
      throw new Error('Role is already assigned to this user');
    }

    // Create role assignment
    const assignment = await ctx.prisma.userRoleAssignment.create({
      data: {
        userId: input.userId,
        roleId: input.roleId,
        assignedBy: input.assignedBy,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    return {
      assignment,
    };
  });
