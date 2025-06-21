import { userUpdateProcedure } from '../../lib/trpc.js';
import { hashPassword } from '../../utils/getPasswordHash.js';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

export const zEditUserTrpcInput = z.object({
  id: z.string().uuid(),
  email: z.string().email().optional(),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  middleName: z.string().min(1).max(100).optional(),
  roleIds: z.array(z.string().uuid()).optional(),
  password: z.string().min(8).max(100).optional(),
});

export const editUserTrpcRoute = userUpdateProcedure
  .input(zEditUserTrpcInput)
  .mutation(async ({ input, ctx }) => {
    // Verify user exists
    const existingUser = await ctx.prisma.user.findUnique({
      where: { id: input.id },
    });

    if (!existingUser) {
      throw new Error('User not found');
    }

    // If email is being changed, check if it's already in use
    if (input.email && input.email !== existingUser.email) {
      const userWithEmail = await ctx.prisma.user.findUnique({
        where: { email: input.email },
      });

      if (userWithEmail) {
        throw new Error('Email is already in use by another user');
      }
    }

    // If roleIds are being changed, verify they exist
    if (input.roleIds && input.roleIds.length > 0) {
      const roles = await ctx.prisma.role.findMany({
        where: { id: { in: input.roleIds } },
      });

      if (roles.length !== input.roleIds.length) {
        throw new Error('One or more selected roles do not exist');
      }
    }

    // Prepare data for update
    const updateData: Prisma.UserUpdateInput = {};

    if (input.email) updateData.email = input.email;
    if (input.firstName) updateData.firstName = input.firstName;
    if (input.lastName) updateData.lastName = input.lastName;
    if (input.middleName !== undefined) updateData.middleName = input.middleName;

    // Hash password if it's being updated
    if (input.password) {
      updateData.password = await hashPassword(input.password);
    }

    // Update user
    const updatedUser = await ctx.prisma.user.update({
      where: { id: input.id },
      data: updateData,
    });

    // Handle role assignments if roleIds are provided
    if (input.roleIds !== undefined) {
      // Check if user currently has admin role and if we're removing it
      const currentAssignments = await ctx.prisma.userRoleAssignment.findMany({
        where: { userId: input.id },
        include: {
          role: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      const currentlyHasAdmin = currentAssignments.some(
        assignment => assignment.role.name === 'admin'
      );

      // Check if admin role is in new roleIds
      const roles = await ctx.prisma.role.findMany({
        where: { id: { in: input.roleIds } },
        select: { id: true, name: true },
      });

      const willHaveAdmin = roles.some(role => role.name === 'admin');

      // If removing admin role from user, check if they're the last admin
      if (currentlyHasAdmin && !willHaveAdmin) {
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

      // Remove all existing role assignments
      await ctx.prisma.userRoleAssignment.deleteMany({
        where: { userId: input.id },
      });

      // Add new role assignments if any
      if (input.roleIds.length > 0) {
        await ctx.prisma.userRoleAssignment.createMany({
          data: input.roleIds.map(roleId => ({
            userId: input.id,
            roleId: roleId,
          })),
        });
      }
    }

    // Get user with roles
    const userWithRoles = await ctx.prisma.user.findUnique({
      where: { id: input.id },
      include: {
        roleAssignments: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
        },
      },
    });

    return {
      user: {
        id: updatedUser.id,
        firstName: updatedUser.firstName,
        middleName: updatedUser.middleName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        roles: userWithRoles?.roleAssignments.map(assignment => assignment.role) || [],
      },
    };
  });
