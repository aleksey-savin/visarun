import { z } from 'zod';
import { procedure } from '../../lib/trpc.js';

export const logoutSchema = z.object({
  refreshToken: z.string(),
});

export const logoutTrpcRoute = procedure.input(logoutSchema).mutation(async ({ ctx, input }) => {
  // Delete the refresh token from the database
  await ctx.prisma.refreshToken.deleteMany({
    where: { token: input.refreshToken },
  });

  return { success: true };
});
