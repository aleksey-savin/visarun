import { messageTemplateManageProcedure } from '../../lib/trpc.js';

export const getAllMessageTemplatesTrpcRoute = messageTemplateManageProcedure.query(
  async ({ ctx }) => {
    const messageTemplates = await ctx.prisma.messageTemplate.findMany({
      orderBy: { title: 'asc' },
    });

    return { messageTemplates };
  }
);
