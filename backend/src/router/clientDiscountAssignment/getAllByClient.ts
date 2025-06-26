import { clientDiscountAssignmentReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

export const zGetAllClientDiscountAssignmentsByClientTrpcInput = z.object({
  clientId: z.string().uuid(),
  includeInactive: z.boolean().optional().default(false),
  includeExpired: z.boolean().optional().default(false),
  limit: z.number().min(1).max(100).optional().default(20),
  offset: z.number().min(0).optional().default(0),
  sortBy: z.enum(['assignedAt', 'ruleName', 'validTo']).optional().default('assignedAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const getAllClientDiscountAssignmentsByClientTrpcRoute =
  clientDiscountAssignmentReadProcedure
    .input(zGetAllClientDiscountAssignmentsByClientTrpcInput)
    .query(async ({ input, ctx }) => {
      // Check if client exists
      const client = await ctx.prisma.client.findUnique({
        where: { id: input.clientId },
      });

      if (!client) {
        throw new Error('Client not found');
      }

      const whereClause: Prisma.ClientDiscountAssignmentWhereInput = {
        clientId: input.clientId,
      };

      // Filter conditions for rule
      const ruleFilters: Prisma.ClientDiscountRuleWhereInput = {};

      // Filter out inactive rules unless explicitly requested
      if (!input.includeInactive) {
        ruleFilters.isActive = true;
      }

      // Filter out expired rules unless explicitly requested
      if (!input.includeExpired) {
        const now = new Date();
        ruleFilters.validTo = {
          gte: now,
        };
      }

      // Add rule filters to where clause
      if (Object.keys(ruleFilters).length > 0) {
        whereClause.rule = ruleFilters;
      }

      // Build order by clause
      let orderBy: Prisma.ClientDiscountAssignmentOrderByWithRelationInput = {};

      switch (input.sortBy) {
        case 'assignedAt':
          orderBy = { assignedAt: input.sortOrder };
          break;
        case 'ruleName':
          orderBy = { rule: { name: input.sortOrder } };
          break;
        case 'validTo':
          orderBy = { rule: { validTo: input.sortOrder } };
          break;
        default:
          orderBy = { assignedAt: input.sortOrder };
      }

      const [assignments, totalCount] = await Promise.all([
        ctx.prisma.clientDiscountAssignment.findMany({
          where: whereClause,
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
                appliesAutomatically: true,
                validFrom: true,
                validTo: true,
                minOrders: true,
                isActive: true,
                note: true,
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
          where: whereClause,
        }),
      ]);

      // Add computed fields to each assignment
      const now = new Date();
      const assignmentsWithMetadata = await Promise.all(
        assignments.map(async assignment => {
          const isCurrentlyValid =
            now >= assignment.rule.validFrom && now <= assignment.rule.validTo;
          const isExpired = now > assignment.rule.validTo;
          const daysUntilExpiry = Math.ceil(
            (assignment.rule.validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );
          const daysUntilActive =
            assignment.rule.validFrom > now
              ? Math.ceil(
                  (assignment.rule.validFrom.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
                )
              : 0;

          // Get usage count for this specific rule and client
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
                status: 'paid',
              },
            },
          });

          return {
            ...assignment,
            metadata: {
              isCurrentlyValid,
              isExpired,
              daysUntilExpiry,
              daysUntilActive,
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
