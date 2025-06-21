import { userCreateProcedure } from '../../lib/trpc.js';
import { hashPassword } from '../../utils/getPasswordHash.js';

import { z } from 'zod';

export const zCreateUserTrpcInput = z.object({
  email: z.string().email(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  middleName: z.string().min(1).max(100).optional(),
  roleIds: z.array(z.string().uuid()).min(1),
  password: z.string().min(8).max(100),
});

export const createUserTrpcRoute = userCreateProcedure
  .input(zCreateUserTrpcInput)
  .mutation(async ({ input, ctx }) => {
    const existingUser = await ctx.prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      throw new Error('User already exists');
    }

    // Verify all roles exist
    const roles = await ctx.prisma.role.findMany({
      where: { id: { in: input.roleIds } },
    });

    if (roles.length !== input.roleIds.length) {
      throw new Error('One or more selected roles do not exist');
    }

    // Use the same password hashing function that's used for verification
    const hashedPassword = await hashPassword(input.password);

    const user = await ctx.prisma.user.create({
      data: {
        firstName: input.firstName,
        middleName: input.middleName,
        lastName: input.lastName,
        email: input.email,
        password: hashedPassword,
      },
    });

    // Create role assignments
    await ctx.prisma.userRoleAssignment.createMany({
      data: input.roleIds.map(roleId => ({
        userId: user.id,
        roleId: roleId,
      })),
    });

    // Get user with assigned roles
    const userWithRoles = await ctx.prisma.user.findUnique({
      where: { id: user.id },
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
        id: user.id,
        firstName: user.firstName,
        middleName: user.middleName,
        lastName: user.lastName,
        email: user.email,
        roles: userWithRoles?.roleAssignments.map(assignment => assignment.role) || [],
      },
    };
  });
