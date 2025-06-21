import { procedure } from '../../lib/trpc.js';
import { z } from 'zod';
import { verifyPassword, hashPassword } from '../../utils/getPasswordHash.js';
import { TRPCError } from '@trpc/server';

// Schema for changing password
export const changePasswordSchema = z.object({
  email: z.string().email(),
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(100),
});

export const changePasswordTrpcRoute = procedure
  .input(changePasswordSchema)
  .mutation(async ({ ctx, input }) => {
    // Ensure user is authenticated
    if (!ctx.user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in to change your password',
      });
    }

    // Get the user from the database
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.user.id },
    });

    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    }

    // Verify the current password
    const passwordValid = await verifyPassword(input.currentPassword, user.password);

    if (!passwordValid) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Current password is incorrect',
      });
    }

    // Check if new password is the same as the current one
    if (input.currentPassword === input.newPassword) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'New password must be different from the current password',
      });
    }

    // Hash the new password
    const hashedPassword = await hashPassword(input.newPassword);

    // Update the user's password
    await ctx.prisma.user.update({
      where: { id: ctx.user.id },
      data: { password: hashedPassword },
    });

    return { success: true };
  });

// For the first-time login scenario with default admin
export const forceChangePasswordSchema = z.object({
  email: z.string().email(),
  newPassword: z.string().min(8).max(100),
});

export const forceChangePasswordTrpcRoute = procedure
  .input(forceChangePasswordSchema)
  .mutation(async ({ ctx, input }) => {
    // Ensure user is authenticated
    if (!ctx.user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in to change your password',
      });
    }

    // Get the user from the database
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.user.id },
    });

    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    }

    // For security reasons, only allow force change for default admin
    if (user.email !== 'admin@admin.com') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Force password change is only allowed for the default admin account',
      });
    }

    // Hash the new password
    const hashedPassword = await hashPassword(input.newPassword);

    // Update the user's password and mark password change as completed
    await ctx.prisma.user.update({
      where: { id: ctx.user.id },
      data: { email: input.email, password: hashedPassword, mustChangePassword: false },
    });

    return { success: true };
  });
