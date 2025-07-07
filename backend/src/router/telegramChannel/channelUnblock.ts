import { telegramManageProcedure } from '../../lib/trpc.js';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

// Define input schema
export const channelUnblockSchema = z.object({
  chatId: z.string(),
});

/**
 * Handler for when a Telegram bot is removed from a channel
 * Updates the channel status to "removed" in the database
 */
export const channelUnblockTrpcRoute = telegramManageProcedure
  .input(channelUnblockSchema)
  .mutation(async ({ ctx, input }) => {
    try {
      // Check if channel exists in the database
      const existingChannel = await ctx.prisma.telegramChannel.findFirst({
        where: {
          chatId: input.chatId,
        },
      });

      if (!existingChannel) {
        throw new Error('Channel not found');
      } else {
        const updatedChannel = await ctx.prisma.telegramChannel.update({
          where: {
            chatId: input.chatId,
          },
          data: {
            status: 'active',
          },
        });

        return {
          success: true,
          message: 'Channel status updated to blocked',
          channel: updatedChannel,
        };
      }
    } catch (error) {
      console.error('Error recording channel block:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to record channel block',
        cause: error,
      });
    }
  });
