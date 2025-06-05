import { telegramBotProcedure } from '../../lib/trpc.js';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

// Define input schema
export const channelLeaveSchema = z.object({
  chatId: z.string(),
});

/**
 * Handler for when a Telegram bot is removed from a channel
 * Updates the channel status to "removed" in the database
 */
export const channelLeaveTrpcRoute = telegramBotProcedure
  .input(channelLeaveSchema)
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
        // Update existing channel to "removed" status
        const updatedChannel = await ctx.prisma.telegramChannel.update({
          where: {
            chatId: input.chatId,
          },
          data: {
            status: 'kicked',
          },
        });

        return {
          success: true,
          message: 'Channel status updated to kicked',
          channel: updatedChannel,
        };
      }
    } catch (error) {
      console.error('Error recording channel leave:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to record channel leave',
        cause: error,
      });
    }
  });
