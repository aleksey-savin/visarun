import { commentCreateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zCreateCommentTrpcInput = z.object({
  clientId: z.string().uuid().optional(),
  orderId: z.string().uuid().optional(),
  orderItemId: z.string().uuid().optional(),
  content: z.string().min(1),
  documentUrl: z.string().url().optional(),
});

export const createCommentTrpcRoute = commentCreateProcedure
  .input(zCreateCommentTrpcInput)
  .mutation(async ({ input, ctx }) => {
    // Validate that at least one of the reference IDs is provided
    if (!input.clientId && !input.orderId && !input.orderItemId) {
      throw new Error('At least one of clientId, orderId, or orderItemId must be provided');
    }

    // Validate references exist
    if (input.clientId) {
      const client = await ctx.prisma.client.findUnique({
        where: { id: input.clientId },
      });
      if (!client) {
        throw new Error('Client not found');
      }
    }

    if (input.orderId) {
      const order = await ctx.prisma.order.findUnique({
        where: { id: input.orderId },
      });
      if (!order) {
        throw new Error('Order not found');
      }
    }

    if (input.orderItemId) {
      const orderItem = await ctx.prisma.orderItem.findUnique({
        where: { id: input.orderItemId },
      });
      if (!orderItem) {
        throw new Error('Order item not found');
      }
    }

    // Create comment
    const comment = await ctx.prisma.comment.create({
      data: {
        clientId: input.clientId,
        orderId: input.orderId,
        orderItemId: input.orderItemId,
        content: input.content,
        documentUrl: input.documentUrl,
        userId: ctx.user?.id,
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
