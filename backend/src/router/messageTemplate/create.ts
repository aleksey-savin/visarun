import { messageTemplateManageProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zCreateMessageTemplateTrpcInput = z.object({
  title: z.string().min(1).max(100),
  body: z.string().min(1),
  telegramChannels: z.array(z.object({ id: z.string() })).min(0),
});

export const createMessageTemplateTrpcRoute = messageTemplateManageProcedure
  .input(zCreateMessageTemplateTrpcInput)
  .mutation(async ({ input, ctx }) => {
    // Check if message template already exists
    const existingMessageTemplate = await ctx.prisma.messageTemplate.findFirst({
      where: {
        title: {
          equals: input.title,
          mode: 'insensitive',
        },
      },
    });

    if (existingMessageTemplate) {
      throw new Error('Message template title already exists');
    }

    // Create message template
    const newMessageTemplate = await ctx.prisma.messageTemplate.create({
      data: {
        title: input.title,
        body: input.body,
        telegramChannels: {
          connect: input.telegramChannels
            .map(targetChannel => {
              return targetChannel.id;
            })
            .map(id => ({ id })),
        },
      },
    });

    return {
      messageTemplate: newMessageTemplate,
    };
  });
