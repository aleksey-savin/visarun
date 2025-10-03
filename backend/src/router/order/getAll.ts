import { orderReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

interface OrderItem {
  basePrice: number;
  finalPrice: number;
  discountAmount: number;
}

interface OrderWithItems {
  items: OrderItem[];
}

export const zGetAllOrdersTrpcInput = z.object({
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
  workStatus: z.enum(['in-work', 'archived']).optional().default('in-work'),
  userId: z.string().uuid().optional(),
  search: z.string().optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  limit: z.number().min(1).max(200).optional().default(100),
  offset: z.number().min(0).optional().default(0),
  sortBy: z.enum(['createdAt', 'status']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const getAllOrdersTrpcRoute = orderReadProcedure
  .input(zGetAllOrdersTrpcInput)
  .query(async ({ input, ctx }) => {
    const whereClause: Prisma.OrderWhereInput = {};

    // Filter by work status (in-work vs archived)
    if (input.workStatus === 'archived') {
      whereClause.status = {
        in: ['completed', 'cancelled'],
      };
    } else {
      // in-work: exclude completed and cancelled
      whereClause.status = {
        in: ['draft', 'personal_data_verification', 'payment_pending', 'submitted'],
      };
    }

    // Filter by specific status if provided (overrides workStatus filter)
    if (input.status) {
      whereClause.status = input.status;
    }

    // Filter by user ID
    if (input.userId) {
      // Check if user exists
      const user = await ctx.prisma.user.findUnique({
        where: { id: input.userId },
      });

      if (!user) {
        throw new Error('User not found');
      }

      whereClause.userId = input.userId;
    }

    // Search functionality
    if (input.search) {
      const searchTerm = input.search.toLowerCase();
      whereClause.OR = [
        {
          id: {
            contains: searchTerm,
            mode: 'insensitive',
          },
        },
        {
          user: {
            firstName: {
              contains: searchTerm,
              mode: 'insensitive',
            },
          },
        },
        {
          user: {
            lastName: {
              contains: searchTerm,
              mode: 'insensitive',
            },
          },
        },
        {
          user: {
            email: {
              contains: searchTerm,
              mode: 'insensitive',
            },
          },
        },
      ];
    }

    // Filter by date range
    if (input.dateFrom || input.dateTo) {
      whereClause.createdAt = {};
      if (input.dateFrom) {
        whereClause.createdAt.gte = input.dateFrom;
      }
      if (input.dateTo) {
        whereClause.createdAt.lte = input.dateTo;
      }
    }

    // Build order by clause
    const orderBy: Record<string, 'asc' | 'desc'> = {};
    orderBy[input.sortBy] = input.sortOrder;

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
        orderBy,
        take: input.limit,
        skip: input.offset,
      }),
      ctx.prisma.order.count({
        where: whereClause,
      }),
    ]);

    // Calculate totals for each order
    const ordersWithTotals = orders.map((order: OrderWithItems) => {
      const totalBasePrice = order.items.reduce(
        (sum: number, item: OrderItem) => sum + item.basePrice,
        0
      );
      const totalFinalPrice = order.items.reduce(
        (sum: number, item: OrderItem) => sum + item.finalPrice,
        0
      );
      const totalDiscount = order.items.reduce(
        (sum: number, item: OrderItem) => sum + item.discountAmount,
        0
      );

      return {
        ...order,
        totals: {
          basePrice: totalBasePrice,
          finalPrice: totalFinalPrice,
          discountAmount: totalDiscount,
          savings: totalBasePrice - totalFinalPrice,
        },
      };
    });

    return {
      orders: ordersWithTotals,
      totalCount,
      hasMore: input.offset + input.limit < totalCount,
      pagination: {
        limit: input.limit,
        offset: input.offset,
        totalPages: Math.ceil(totalCount / input.limit),
        currentPage: Math.floor(input.offset / input.limit) + 1,
      },
    };
  });
