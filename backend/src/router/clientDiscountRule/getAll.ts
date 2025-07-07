import { clientDiscountRuleReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

export const zGetAllClientDiscountRulesTrpcInput = z.object({
  isActive: z.boolean().optional(),
  appliesToService: z.enum(['visa', 'visarun', 'all']).optional(),
  discountType: z.enum(['percent', 'fixed']).optional(),
  appliesAutomatically: z.boolean().optional(),
  includeExpired: z.boolean().optional().default(false),
  limit: z.number().min(1).max(100).optional().default(20),
  offset: z.number().min(0).optional().default(0),
  sortBy: z
    .enum(['name', 'createdAt', 'validFrom', 'validTo', 'discountValue'])
    .optional()
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const getAllClientDiscountRulesTrpcRoute = clientDiscountRuleReadProcedure
  .input(zGetAllClientDiscountRulesTrpcInput)
  .query(async ({ input, ctx }) => {
    const whereClause: Prisma.ClientDiscountRuleWhereInput = {};

    // Filter by active status
    if (input.isActive !== undefined) {
      whereClause.isActive = input.isActive;
    }

    // Filter by service type
    if (input.appliesToService) {
      whereClause.appliesToService = input.appliesToService;
    }

    // Filter by discount type
    if (input.discountType) {
      whereClause.discountType = input.discountType;
    }

    // Filter by applies automatically
    if (input.appliesAutomatically !== undefined) {
      whereClause.appliesAutomatically = input.appliesAutomatically;
    }

    // Filter out expired rules unless explicitly requested
    if (!input.includeExpired) {
      const now = new Date();
      whereClause.validTo = {
        gte: now,
      };
    }

    // Build order by clause
    const orderBy: Record<string, 'asc' | 'desc'> = {};
    orderBy[input.sortBy] = input.sortOrder;

    const [clientDiscountRules, totalCount] = await Promise.all([
      ctx.prisma.clientDiscountRule.findMany({
        where: whereClause,
        include: {
          assignments: {
            include: {
              client: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          OrderItem: true,
        },
        orderBy,
        take: input.limit,
        skip: input.offset,
      }),
      ctx.prisma.clientDiscountRule.count({
        where: whereClause,
      }),
    ]);

    // Add computed fields to each rule
    const now = new Date();
    const rulesWithMetadata = clientDiscountRules.map(rule => {
      const isCurrentlyValid = now >= rule.validFrom && now <= rule.validTo;
      const isExpired = now > rule.validTo;
      const daysUntilExpiry = Math.ceil(
        (rule.validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      const daysUntilActive =
        rule.validFrom > now
          ? Math.ceil((rule.validFrom.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          : 0;

      return {
        ...rule,
        metadata: {
          isCurrentlyValid,
          isExpired,
          daysUntilExpiry,
          daysUntilActive,
          totalUsage: rule.OrderItem.length,
          activeAssignments: rule.assignments.length,
        },
      };
    });

    return {
      clientDiscountRules: rulesWithMetadata,
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
