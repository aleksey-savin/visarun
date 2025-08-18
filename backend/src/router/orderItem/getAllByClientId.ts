import { orderItemReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zGetAllOrderItemsByClientIdTrpcInput = z.object({
  clientId: z.string().uuid(),
  status: z
    .enum([
      'draft',
      'personal_data_verification',
      'payment_pending',
      'submitted',
      'completed',
      'cancelled',
    ])
    .optional(),
  limit: z.number().min(1).max(100).optional().default(20),
  offset: z.number().min(0).optional().default(0),
});

export const getAllOrderItemsByClientIdTrpcRoute = orderItemReadProcedure
  .input(zGetAllOrderItemsByClientIdTrpcInput)
  .query(async ({ input, ctx }) => {
    // Check if client exists
    const client = await ctx.prisma.client.findUnique({
      where: { id: input.clientId },
    });

    if (!client) {
      throw new Error('Client not found');
    }

    const whereClause = {
      clientId: input.clientId,
      ...(input.status && {
        order: {
          status: input.status,
        },
      }),
    };

    const [orderItems, totalCount] = await Promise.all([
      ctx.prisma.orderItem.findMany({
        where: whereClause,
        include: {
          order: {
            select: {
              id: true,
              status: true,
              createdAt: true,
              user: {
                select: {
                  id: true,
                  firstName: true,
                  middleName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              citizenship: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          discountRule: {
            select: {
              id: true,
              name: true,
              discountType: true,
              discountValue: true,
              appliesToService: true,
            },
          },
        },
        orderBy: {
          order: {
            createdAt: 'desc',
          },
        },
        take: input.limit,
        skip: input.offset,
      }),
      ctx.prisma.orderItem.count({
        where: whereClause,
      }),
    ]);

    return {
      orderItems,
      totalCount,
      hasMore: input.offset + input.limit < totalCount,
    };
  });
