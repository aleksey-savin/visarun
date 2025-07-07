import { roleDeleteProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zDeleteRoleTrpcInput = z.object({
  id: z.string().uuid(),
});

export const deleteRoleTrpcRoute = roleDeleteProcedure
  .input(zDeleteRoleTrpcInput)
  .mutation(async ({ input, ctx }) => {
    // Verify role exists
    const existingRole = await ctx.prisma.role.findUnique({
      where: { id: input.id },
      include: {
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!existingRole) {
      throw new Error('Role not found');
    }

    // Cannot delete system roles
    if (existingRole.isSystem) {
      throw new Error('Cannot delete system roles');
    }

    // Check if role is assigned to any users
    if (existingRole.assignments.length > 0) {
      const userNames = existingRole.assignments
        .map(assignment => `${assignment.user.firstName} ${assignment.user.lastName}`)
        .join(', ');

      throw new Error(
        `Cannot delete role "${existingRole.name}" because it is assigned to the following users: ${userNames}. ` +
          'Please remove the role from these users first.'
      );
    }

    // Delete the role and its permissions in a transaction
    await ctx.prisma.$transaction(async prisma => {
      // Delete role permissions
      await prisma.rolePermission.deleteMany({
        where: { roleId: input.id },
      });

      // Delete the role
      await prisma.role.delete({
        where: { id: input.id },
      });
    });

    return {
      message: `Role "${existingRole.name}" has been successfully deleted.`,
      deletedRole: {
        id: existingRole.id,
        name: existingRole.name,
        description: existingRole.description,
      },
    };
  });
