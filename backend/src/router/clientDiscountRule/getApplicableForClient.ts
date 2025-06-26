import { clientDiscountRuleReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zGetApplicableClientDiscountRulesTrpcInput = z.object({
  clientId: z.string().uuid(),
  serviceType: z.enum(['visa', 'visarun']).optional(),
  includeAutomatic: z.boolean().optional().default(true),
  includeManual: z.boolean().optional().default(true),
});

export const getApplicableClientDiscountRulesTrpcRoute = clientDiscountRuleReadProcedure
  .input(zGetApplicableClientDiscountRulesTrpcInput)
  .query(async ({ input, ctx }) => {
    // Check if client exists
    const client = await ctx.prisma.client.findUnique({
      where: { id: input.clientId },
    });

    if (!client) {
      throw new Error('Client not found');
    }

    const now = new Date();

    // Get client's total paid orders count
    const clientTotalOrders = await ctx.prisma.orderItem.count({
      where: {
        clientId: input.clientId,
        order: {
          status: 'paid',
        },
      },
    });

    // Build where clause for discount rules
    const whereClause: Record<string, unknown> = {
      isActive: true,
      validFrom: { lte: now },
      validTo: { gte: now },
      minOrders: { lte: clientTotalOrders },
    };

    // Filter by service type if specified
    if (input.serviceType) {
      whereClause.OR = [{ appliesToService: 'all' }, { appliesToService: input.serviceType }];
    } else {
      whereClause.appliesToService = 'all';
    }

    // Filter by automatic/manual application
    const applicationFilters = [];
    if (input.includeAutomatic) {
      applicationFilters.push({ appliesAutomatically: true });
    }
    if (input.includeManual) {
      applicationFilters.push({ appliesAutomatically: false });
    }

    if (applicationFilters.length > 0) {
      if (whereClause.OR) {
        whereClause.AND = [{ OR: whereClause.OR }, { OR: applicationFilters }];
        delete whereClause.OR;
      } else {
        whereClause.OR = applicationFilters;
      }
    }

    // Get all potentially applicable rules
    const potentialRules = await ctx.prisma.clientDiscountRule.findMany({
      where: whereClause,
      include: {
        assignments: {
          where: {
            clientId: input.clientId,
          },
        },
        OrderItem: true,
      },
      orderBy: [
        { appliesAutomatically: 'desc' }, // Automatic rules first
        { discountValue: 'desc' }, // Higher discounts first
        { name: 'asc' },
      ],
    });

    // Filter rules based on assignment requirements
    const applicableRules = potentialRules.filter(rule => {
      if (rule.appliesAutomatically) {
        // Automatic rules are always applicable if they meet other criteria
        return true;
      } else {
        // Manual rules require explicit assignment
        return rule.assignments.length > 0;
      }
    });

    // Add metadata to each rule
    const rulesWithMetadata = applicableRules.map(rule => {
      const isAssigned = rule.assignments.length > 0;
      const assignment = rule.assignments[0] || null;
      const daysUntilExpiry = Math.ceil(
        (rule.validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Calculate potential savings for different order amounts
      const potentialSavings = {
        on100:
          rule.discountType === 'percent'
            ? (100 * rule.discountValue) / 100
            : Math.min(rule.discountValue, 100),
        on500:
          rule.discountType === 'percent'
            ? (500 * rule.discountValue) / 100
            : Math.min(rule.discountValue, 500),
        on1000:
          rule.discountType === 'percent'
            ? (1000 * rule.discountValue) / 100
            : Math.min(rule.discountValue, 1000),
      };

      return {
        ...rule,
        assignment,
        metadata: {
          isAssigned,
          isAutomatic: rule.appliesAutomatically,
          daysUntilExpiry,
          totalUsage: rule.OrderItem.length,
          potentialSavings,
          eligibilityStatus: {
            meetsMinOrders: clientTotalOrders >= rule.minOrders,
            isCurrentlyValid: true, // Already filtered for this
            isActive: rule.isActive, // Already filtered for this
            hasAssignment: isAssigned,
            canUse: rule.appliesAutomatically || isAssigned,
          },
        },
      };
    });

    // Separate automatic and manual rules
    const automaticRules = rulesWithMetadata.filter(rule => rule.appliesAutomatically);
    const manualRules = rulesWithMetadata.filter(rule => !rule.appliesAutomatically);

    return {
      applicableRules: rulesWithMetadata,
      summary: {
        total: rulesWithMetadata.length,
        automatic: automaticRules.length,
        manual: manualRules.length,
        clientTotalOrders,
        bestRule: rulesWithMetadata.length > 0 ? rulesWithMetadata[0] : null,
      },
      categorized: {
        automatic: automaticRules,
        manual: manualRules,
      },
    };
  });
