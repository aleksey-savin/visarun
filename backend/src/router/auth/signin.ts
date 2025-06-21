import { trpc } from '../../lib/trpc.js';
import { verifyPassword } from '../../utils/getPasswordHash.js';
import { generateAccessToken, generateRefreshToken } from '../../utils/jwt.js';
import { z } from 'zod';

export const signinSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const signinTrpcRoute = trpc.procedure
  .input(signinSchema)
  .mutation(async ({ ctx, input }) => {
    // First, find the user by email only
    const user = await ctx.prisma.user.findUnique({
      where: {
        email: input.email,
      },
      include: {
        roleAssignments: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Then verify the password using bcrypt.compare
    const passwordValid = await verifyPassword(input.password, user.password);

    if (!passwordValid) {
      throw new Error('Invalid email or password');
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Extract permissions from role assignments
    const permissions = new Set<string>();
    for (const assignment of user.roleAssignments) {
      for (const rolePermission of assignment.role.permissions) {
        permissions.add(rolePermission.permission.code);
      }
    }

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.roleAssignments.map(assignment => assignment.role.name),
        permissions: Array.from(permissions),
        mustChangePassword: user.mustChangePassword,
      },
    };
  });
