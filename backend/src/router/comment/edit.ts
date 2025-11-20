import { commentUpdateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zEditCommentTrpcInput = z.object({
  id: z.string().uuid(),
  content: z.string().min(1).optional(),
  documentUrl: z.string().url().optional(),
});

export const editCommentTrpcRoute = commentUpdateProcedure
  .input(zEditCommentTrpcInput)
  .mutation(async ({ input, ctx }) => {
    // Check if comment exists
    const existingComment = await ctx.prisma.comment.findUnique({
      where: { id: input.id },
    });

    if (!existingComment) {
      throw new Error('Comment not found');
    }

    // Check if user has permission to edit this comment
    if (existingComment.userId !== ctx.user?.id && !ctx.user?.roles?.includes('admin')) {
      throw new Error('You do not have permission to edit this comment');
    }

    // Update comment
    const comment = await ctx.prisma.comment.update({
      where: { id: input.id },
      data: {
        content: input.content,
        documentUrl: input.documentUrl,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        order: {
          select: {
            id: true,
            status: true,
          },
        },
        orderItem: {
          select: {
            id: true,
            serviceType: true,
          },
        },
      },
    });

    return {
      comment,
    };
  });
