import { messageTemplateManageProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zGetOneMessageTemplateTrpcInput = z.object({
  id: z.string().min(1),
});

export const getOneMessageTemplateTrpcRoute = messageTemplateManageProcedure
  .input(zGetOneMessageTemplateTrpcInput)
  .query(async ({ input, ctx }) => {
    const messageTemplate = await ctx.prisma.messageTemplate.findUnique({
      where: { id: input.id },
      select: {
        id: true,
        title: true,
        body: true,
        telegramChannels: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!messageTemplate) {
      throw new Error('Message template not found');
    }

    return { messageTemplate };
  });
