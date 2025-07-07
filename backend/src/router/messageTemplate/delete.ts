import { messageTemplateManageProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zDeleteMessageTemplateTrpcInput = z.object({
  id: z.string().min(1),
});

export const deleteMessageTemplateTrpcRoute = messageTemplateManageProcedure
  .input(zDeleteMessageTemplateTrpcInput)
  .mutation(async ({ input, ctx }) => {
    const { id } = input;

    // Check if city exists
    const existingMessageTemplate = await ctx.prisma.messageTemplate.findUnique({
      where: { id },
    });

    if (!existingMessageTemplate) {
      throw new Error('Message template not found');
    }

    // Delete message template
    await ctx.prisma.messageTemplate.delete({
      where: { id },
    });

    return {
      success: true,
      message: `Message template "${existingMessageTemplate.title}" has been deleted successfully`,
    };
  });
