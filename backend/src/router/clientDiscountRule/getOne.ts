import { clientDiscountRuleReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zGetClientDiscountRuleTrpcInput = z.object({
  id: z.string().uuid(),
});

export const getClientDiscountRuleTrpcRoute = clientDiscountRuleReadProcedure
  .input(zGetClientDiscountRuleTrpcInput)
  .query(async ({ input, ctx }) => {
    const clientDiscountRule = await ctx.prisma.clientDiscountRule.findUnique({
      where: { id: input.id },
      include: {
        assignments: {
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
            assignedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: {
            assignedAt: 'desc',
          },
        },
        OrderItem: {
          include: {
            order: {
              select: {
                id: true,
                status: true,
                createdAt: true,
              },
            },
            client: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            order: {
              createdAt: 'desc',
            },
          },
          take: 10, // Limit recent usage
        },
      },
    });

    if (!clientDiscountRule) {
      throw new Error('Client discount rule not found');
    }

    // Calculate usage statistics
    const totalUsage = clientDiscountRule.OrderItem.length;
    const activeAssignments = clientDiscountRule.assignments.length;

    // Check if rule is currently valid
    const now = new Date();
    const isCurrentlyValid =
      now >= clientDiscountRule.validFrom && now <= clientDiscountRule.validTo;

    return {
      clientDiscountRule: {
        ...clientDiscountRule,
        statistics: {
          totalUsage,
          activeAssignments,
          isCurrentlyValid,
          daysUntilExpiry: Math.ceil(
            (clientDiscountRule.validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          ),
        },
      },
    };
  });
