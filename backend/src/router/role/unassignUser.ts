import { roleAssignProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zUnassignUserRoleTrpcInput = z.object({
  userId: z.string().uuid(),
  roleId: z.string().uuid(),
});

export const unassignUserRoleTrpcRoute = roleAssignProcedure
  .input(zUnassignUserRoleTrpcInput)
  .mutation(async ({ input, ctx }) => {
    // Verify assignment exists
    const assignment = await ctx.prisma.userRoleAssignment.findFirst({
      where: {
        userId: input.userId,
        roleId: input.roleId,
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

    if (!assignment) {
      throw new Error('Role assignment not found');
    }

    // Special check for admin role - cannot unassign if it would leave no admin users
    if (assignment.role.name === 'admin') {
      // Count total admin users
      const adminRole = await ctx.prisma.role.findUnique({
        where: { name: 'admin' },
        include: {
          assignments: true,
        },
      });

      if (adminRole && adminRole.assignments.length <= 1) {
        throw new Error(
          'Cannot remove admin role from the last admin user. System must have at least one administrator.'
        );
      }
    }

    // Delete role assignment
    await ctx.prisma.userRoleAssignment.delete({
      where: {
        id: assignment.id,
      },
    });

    return {
      message: 'Role unassigned successfully',
      assignment,
    };
  });
