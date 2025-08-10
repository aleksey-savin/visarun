import { userDeleteProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const deleteUserTrpcRoute = userDeleteProcedure
  .input(z.object({ id: z.string() }))
  .mutation(async ({ input, ctx }) => {
    const existingUser = await ctx.prisma.user.findUnique({
      where: { id: input.id },
      include: {
        roleAssignments: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!existingUser) {
      throw new Error('User not found');
    }

    // Check if user has admin role
    const hasAdminRole = existingUser.roleAssignments.some(
      assignment => assignment.role.name === 'admin'
    );

    if (hasAdminRole) {
      // Count total admin users
      const adminRole = await ctx.prisma.role.findUnique({
        where: { name: 'admin' },
        include: {
          assignments: true,
        },
      });

      if (adminRole && adminRole.assignments.length <= 1) {
        throw new Error(
          'Cannot delete the last admin user. System must have at least one administrator.'
        );
      }
    }

    // Delete user and their role assignments in a transaction
    await ctx.prisma.$transaction(async prisma => {
      // Delete role assignments
      await prisma.userRoleAssignment.deleteMany({
        where: { userId: input.id },
      });

      // Delete contact methods assignments
      await prisma.userContactMethod.deleteMany({
        where: { userId: input.id },
      });

      // Delete clients
      await prisma.client.deleteMany({
        where: { userId: input.id },
      });

      // Delete the user
      await prisma.user.delete({
        where: { id: input.id },
      });
    });

    return { message: 'User deleted successfully' };
  });
