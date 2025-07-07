import { z } from 'zod';
import { verifyToken, generateAccessToken } from '../../utils/jwt.js';
import { procedure } from '../../lib/trpc.js';
import { TRPCError } from '@trpc/server';

export const refreshTokenSchema = z.object({
  refreshToken: z.string(),
});

export const refreshTokenRoute = procedure
  .input(refreshTokenSchema)
  .mutation(async ({ ctx, input }) => {
    // Verify the token exists in database first
    const storedToken = await ctx.prisma.refreshToken.findUnique({
      where: { token: input.refreshToken },
      include: {
        user: {
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
        },
      },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      // Delete the token if it's expired
      if (storedToken) {
        await ctx.prisma.refreshToken.delete({
          where: { id: storedToken.id },
        });
      }

      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired refresh token',
      });
    }

    // Verify the JWT signature and expiration
    const payload = verifyToken(input.refreshToken);
    if (!payload) {
      // Delete the token as it's invalid
      await ctx.prisma.refreshToken.delete({
        where: { id: storedToken.id },
      });

      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired refresh token',
      });
    }

    // Generate a new access token
    const accessToken = generateAccessToken(storedToken.user);

    // Extract permissions from role assignments
    const permissions = new Set<string>();
    for (const assignment of storedToken.user.roleAssignments) {
      for (const rolePermission of assignment.role.permissions) {
        permissions.add(rolePermission.permission.code);
      }
    }

    return {
      accessToken,
      user: {
        id: storedToken.user.id,
        email: storedToken.user.email,
        firstName: storedToken.user.firstName,
        lastName: storedToken.user.lastName,
        roles: storedToken.user.roleAssignments.map(assignment => assignment.role.name),
        permissions: Array.from(permissions),
        mustChangePassword: storedToken.user.mustChangePassword,
      },
    };
  });
