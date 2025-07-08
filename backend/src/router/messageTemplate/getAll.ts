import { messageTemplateManageProcedure } from '../../lib/trpc.js';

export const getAllMessageTemplatesTrpcRoute = messageTemplateManageProcedure.query(
  async ({ ctx }) => {
    const messageTemplates = await ctx.prisma.messageTemplate.findMany({
      orderBy: { title: 'asc' },
      select: {
        id: true,
        title: true,
        body: true,
        telegramChannels: {
          select: {
            id: true,
            chatTitle: true,
          },
        },
      },
    });

    return { messageTemplates };
  }
);
