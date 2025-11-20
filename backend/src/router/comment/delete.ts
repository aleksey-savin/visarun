import { commentDeleteProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zDeleteCommentTrpcInput = z.object({
  id: z.string().uuid(),
});

export const deleteCommentTrpcRoute = commentDeleteProcedure
  .input(zDeleteCommentTrpcInput)
  .mutation(async ({ input, ctx }) => {
    // Check if comment exists
    const existingComment = await ctx.prisma.comment.findUnique({
      where: { id: input.id },
    });

    if (!existingComment) {
      throw new Error('Comment not found');
    }

    // Check if user has permission to delete this comment
    if (existingComment.userId !== ctx.user?.id && !ctx.user?.roles?.includes('admin')) {
      throw new Error('You do not have permission to delete this comment');
    }

    // Delete comment
    await ctx.prisma.comment.delete({
      where: { id: input.id },
    });

    return {
      success: true,
      message: 'Comment deleted successfully',
    };
  });
