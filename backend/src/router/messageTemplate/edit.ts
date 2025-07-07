import { messageTemplateManageProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zEditMessageTemplateTrpcInput = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(100),
  body: z.string().min(1),
});

export const editMessageTemplateTrpcRoute = messageTemplateManageProcedure
  .input(zEditMessageTemplateTrpcInput)
  .mutation(async ({ input, ctx }) => {
    const { id, ...updateData } = input;

    // Check if city exists
    const existingMessageTemplate = await ctx.prisma.messageTemplate.findUnique({
      where: { id },
    });

    if (!existingMessageTemplate) {
      throw new Error('Message template not found');
    }

    // Update message template
    const updatedMessageTemplate = await ctx.prisma.messageTemplate.update({
      where: { id },
      data: updateData,
    });

    return {
      messageTemplate: updatedMessageTemplate,
    };
  });
