import { telegramBotProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const channelJoinTrpcInput = z.object({
  chatId: z.string(),
  chatTitle: z.string().min(1).max(255),
  chatType: z.string().min(1).max(255),
  chatUsername: z.string(),
  fromId: z.string(),
  fromIsBot: z.boolean(),
  fromLastName: z.string().max(255),
  fromFirstName: z.string().min(1).max(255),
  fromUsername: z.string().min(1).max(255),
});

export const channelJoinTrpcRoute = telegramBotProcedure
  .input(channelJoinTrpcInput)
  .mutation(async ({ ctx, input }) => {
    const existingChannel = await ctx.prisma.telegramChannel.findFirst({
      where: {
        chatId: input.chatId,
      },
    });

    if (existingChannel) {
      const updatedChannel = await ctx.prisma.telegramChannel.update({
        where: {
          chatId: input.chatId,
        },
        data: {
          status: 'active',
        },
      });
      return { updatedChannel };
    } else {
      const channel = await ctx.prisma.telegramChannel.create({
        data: {
          chatId: input.chatId,
          chatTitle: input.chatTitle,
          chatType: input.chatType,
          chatUsername: input.chatUsername,
          fromId: input.fromId,
          fromIsBot: input.fromIsBot,
          fromLastName: input.fromLastName,
          fromFirstName: input.fromFirstName,
          fromUsername: input.fromUsername,
        },
      });
      return { channel };
    }
  });
