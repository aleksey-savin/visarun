import { z } from 'zod';
import { verifyToken, generateAccessToken } from '../../utils/jwt.ts';
import { procedure } from '../../lib/trpc.ts';
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
      include: { user: true },
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

    return {
      accessToken,
      user: {
        id: storedToken.user.id,
        email: storedToken.user.email,
        firstName: storedToken.user.firstName,
        lastName: storedToken.user.lastName,
        role: storedToken.user.role,
      },
    };
  });
