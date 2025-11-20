import { commentReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zGetCommentTrpcInput = z.object({
  id: z.string().uuid(),
});

export const getCommentTrpcRoute = commentReadProcedure
  .input(zGetCommentTrpcInput)
  .query(async ({ input, ctx }) => {
    const comment = await ctx.prisma.comment.findUnique({
      where: { id: input.id },
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

    if (!comment) {
      throw new Error('Comment not found');
    }

    return {
      comment,
    };
  });
