import { orderReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

export const zGetOrderSummaryTrpcInput = z.object({
  userId: z.string().uuid().optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
});

export const getOrderSummaryTrpcRoute = orderReadProcedure
  .input(zGetOrderSummaryTrpcInput)
  .query(async ({ input, ctx }) => {
    const whereClause: Prisma.OrderWhereInput = {};

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

    if (input.dateFrom || input.dateTo) {
      whereClause.createdAt = {};
      if (input.dateFrom) {
        whereClause.createdAt.gte = input.dateFrom;
      }
      if (input.dateTo) {
        whereClause.createdAt.lte = input.dateTo;
      }
    }

    // Get order counts by status
    const orderStatusCounts = await ctx.prisma.order.groupBy({
      by: ['status'],
      where: whereClause,
      _count: {
        status: true,
      },
    });

    // Get total order count
    const totalOrders = await ctx.prisma.order.count({
      where: whereClause,
    });

    // Get order items summary
    const orderItemsWithPrices = await ctx.prisma.orderItem.findMany({
      where: {
        order: whereClause,
      },
      select: {
        basePrice: true,
        finalPrice: true,
        discountAmount: true,
        serviceType: true,
      },
    });

    // Calculate financial summary
    const totalBasePrice = orderItemsWithPrices.reduce(
      (sum: number, item) => sum + item.basePrice,
      0
    );
    const totalFinalPrice = orderItemsWithPrices.reduce(
      (sum: number, item) => sum + item.finalPrice,
      0
    );
    const totalDiscount = orderItemsWithPrices.reduce(
      (sum: number, item) => sum + item.discountAmount,
      0
    );

    // Service type breakdown
    const serviceTypeBreakdown = orderItemsWithPrices.reduce(
      (
        acc: Record<
          string,
          { count: number; basePrice: number; finalPrice: number; discountAmount: number }
        >,
        item
      ) => {
        if (!acc[item.serviceType]) {
          acc[item.serviceType] = {
            count: 0,
            basePrice: 0,
            finalPrice: 0,
            discountAmount: 0,
          };
        }
        acc[item.serviceType].count++;
        acc[item.serviceType].basePrice += item.basePrice;
        acc[item.serviceType].finalPrice += item.finalPrice;
        acc[item.serviceType].discountAmount += item.discountAmount;
        return acc;
      },
      {} as Record<
        string,
        { count: number; basePrice: number; finalPrice: number; discountAmount: number }
      >
    );

    // Recent orders (last 5)
    const recentOrders = await ctx.prisma.order.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        items: {
          select: {
            id: true,
            serviceType: true,
            finalPrice: true,
            client: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    });

    return {
      summary: {
        totalOrders,
        orderStatusCounts: orderStatusCounts.reduce(
          (acc: Record<string, number>, item) => {
            acc[item.status] = item._count.status;
            return acc;
          },
          {} as Record<string, number>
        ),
        financial: {
          totalBasePrice,
          totalFinalPrice,
          totalDiscount,
          totalSavings: totalBasePrice - totalFinalPrice,
        },
        serviceTypeBreakdown,
        totalOrderItems: orderItemsWithPrices.length,
      },
      recentOrders,
    };
  });
