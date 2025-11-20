import { commentReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zGetAllCommentsTrpcInput = z.object({
  clientId: z.string().uuid().optional(),
  orderId: z.string().uuid().optional(),
  orderItemId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  limit: z.number().min(1).max(100).optional().default(50),
  offset: z.number().min(0).optional().default(0),
});

export const getAllCommentsTrpcRoute = commentReadProcedure
  .input(zGetAllCommentsTrpcInput)
  .query(async ({ input, ctx }) => {
    const where: {
      clientId?: string;
      orderId?: string;
      orderItemId?: string;
      userId?: string;
    } = {};

    // Build where clause based on provided filters
    if (input.clientId) {
      where.clientId = input.clientId;
    }
    if (input.orderId) {
      where.orderId = input.orderId;
    }
    if (input.orderItemId) {
      where.orderItemId = input.orderItemId;
    }
    if (input.userId) {
      where.userId = input.userId;
    }

    const [comments, total] = await Promise.all([
      ctx.prisma.comment.findMany({
        where,
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
        orderBy: {
          createdAt: 'desc',
        },
        take: input.limit,
        skip: input.offset,
      }),
      ctx.prisma.comment.count({ where }),
    ]);

    return {
      comments,
      pagination: {
        total,
        limit: input.limit,
        offset: input.offset,
        hasMore: input.offset + input.limit < total,
      },
    };
  });
