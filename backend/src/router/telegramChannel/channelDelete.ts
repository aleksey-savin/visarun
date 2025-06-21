import { telegramManageProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const channelDeleteTrpcInput = z.object({
  chatId: z.string(),
});

export const channelDeleteTrpcRoute = telegramManageProcedure
  .input(channelDeleteTrpcInput)
  .mutation(async ({ ctx, input }) => {
    const existingChannel = await ctx.prisma.telegramChannel.findFirst({
      where: {
        chatId: input.chatId,
      },
    });

    if (!existingChannel) {
      return { message: 'Channel not found' };
    } else if (existingChannel.status !== 'kicked') {
      return { message: 'Only kicked channels can be deleted' };
    } else {
      await ctx.prisma.telegramChannel.delete({
        where: {
          chatId: input.chatId,
        },
      });
      return { message: 'Channel deleted successfully' };
    }
  });
