import { clientDiscountAssignmentReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zGetAllClientDiscountAssignmentsByRuleTrpcInput = z.object({
  ruleId: z.string().uuid(),
  limit: z.number().min(1).max(100).optional().default(20),
  offset: z.number().min(0).optional().default(0),
  sortBy: z.enum(['assignedAt', 'clientName']).optional().default('assignedAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const getAllClientDiscountAssignmentsByRuleTrpcRoute = clientDiscountAssignmentReadProcedure
  .input(zGetAllClientDiscountAssignmentsByRuleTrpcInput)
  .query(async ({ input, ctx }) => {
    // Check if discount rule exists
    const discountRule = await ctx.prisma.clientDiscountRule.findUnique({
      where: { id: input.ruleId },
    });

    if (!discountRule) {
      throw new Error('Discount rule not found');
    }

    // Build order by clause
    let orderBy: Record<string, 'asc' | 'desc' | Record<string, 'asc' | 'desc'>> = {};

    switch (input.sortBy) {
      case 'assignedAt':
        orderBy = { assignedAt: input.sortOrder };
        break;
      case 'clientName':
        orderBy = { client: { firstName: input.sortOrder } };
        break;
      default:
        orderBy = { assignedAt: input.sortOrder };
    }

    const [assignments, totalCount] = await Promise.all([
      ctx.prisma.clientDiscountAssignment.findMany({
        where: {
          ruleId: input.ruleId,
        },
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
          rule: {
            select: {
              id: true,
              name: true,
              discountType: true,
              discountValue: true,
              appliesToService: true,
              validFrom: true,
              validTo: true,
              minOrders: true,
              isActive: true,
            },
          },
          assignedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy,
        take: input.limit,
        skip: input.offset,
      }),
      ctx.prisma.clientDiscountAssignment.count({
        where: {
          ruleId: input.ruleId,
        },
      }),
    ]);

    // Add computed fields to each assignment
    const now = new Date();
    const assignmentsWithMetadata = await Promise.all(
      assignments.map(async assignment => {
        const isCurrentlyValid = now >= assignment.rule.validFrom && now <= assignment.rule.validTo;
        const isExpired = now > assignment.rule.validTo;
        const daysUntilExpiry = Math.ceil(
          (assignment.rule.validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Get usage count for this specific client and rule
        const usageCount = await ctx.prisma.orderItem.count({
          where: {
            clientId: assignment.clientId,
            discountRuleId: assignment.ruleId,
          },
        });

        // Get total paid orders count for this client
        const clientTotalOrders = await ctx.prisma.orderItem.count({
          where: {
            clientId: assignment.clientId,
            order: {
              status: 'completed',
            },
          },
        });

        return {
          ...assignment,
          metadata: {
            isCurrentlyValid,
            isExpired,
            daysUntilExpiry,
            usageCount,
            clientTotalOrders,
            meetsMinOrdersRequirement: clientTotalOrders >= assignment.rule.minOrders,
            canUseRule:
              isCurrentlyValid &&
              assignment.rule.isActive &&
              clientTotalOrders >= assignment.rule.minOrders,
          },
        };
      })
    );

    return {
      assignments: assignmentsWithMetadata,
      rule: discountRule,
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
