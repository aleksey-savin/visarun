import { orderReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

export const zGetAllOrdersByUserIdTrpcInput = z.object({
  userId: z.string().uuid(),
  status: z.enum(['draft', 'submitted', 'paid', 'cancelled']).optional(),
  limit: z.number().min(1).max(100).optional().default(20),
  offset: z.number().min(0).optional().default(0),
});

export const getAllOrdersByUserIdTrpcRoute = orderReadProcedure
  .input(zGetAllOrdersByUserIdTrpcInput)
  .query(async ({ input, ctx }) => {
    // Check if user exists
    const user = await ctx.prisma.user.findUnique({
      where: { id: input.userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const whereClause: Prisma.OrderWhereInput = {
      userId: input.userId,
    };

    if (input.status) {
      whereClause.status = input.status;
    }

    const [orders, totalCount] = await Promise.all([
      ctx.prisma.order.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              middleName: true,
              lastName: true,
              email: true,
            },
          },
          items: {
            include: {
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
                },
              },
            },
            orderBy: {
              id: 'asc',
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: input.limit,
        skip: input.offset,
      }),
      ctx.prisma.order.count({
        where: whereClause,
      }),
    ]);

    return {
      orders,
      totalCount,
      hasMore: input.offset + input.limit < totalCount,
    };
  });
