import { clientDiscountAssignmentReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zGetClientDiscountAssignmentTrpcInput = z.object({
  id: z.string().uuid(),
});

export const getClientDiscountAssignmentTrpcRoute = clientDiscountAssignmentReadProcedure
  .input(zGetClientDiscountAssignmentTrpcInput)
  .query(async ({ input, ctx }) => {
    const clientDiscountAssignment = await ctx.prisma.clientDiscountAssignment.findUnique({
      where: { id: input.id },
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
            passports: {
              select: {
                id: true,
                expirationDate: true,
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
    });

    if (!clientDiscountAssignment) {
      throw new Error('Client discount assignment not found');
    }

    // Check if rule is currently valid
    const now = new Date();
    const isCurrentlyValid =
      now >= clientDiscountAssignment.rule.validFrom &&
      now <= clientDiscountAssignment.rule.validTo;

    // Get usage statistics for this client and rule
    const usageCount = await ctx.prisma.orderItem.count({
      where: {
        clientId: clientDiscountAssignment.clientId,
        discountRuleId: clientDiscountAssignment.ruleId,
      },
    });

    // Get total orders count for this client to check if they meet minimum orders requirement
    const clientTotalOrders = await ctx.prisma.orderItem.count({
      where: {
        clientId: clientDiscountAssignment.clientId,
        order: {
          status: 'paid',
        },
      },
    });

    return {
      clientDiscountAssignment: {
        ...clientDiscountAssignment,
        statistics: {
          usageCount,
          clientTotalOrders,
          meetsMinOrdersRequirement: clientTotalOrders >= clientDiscountAssignment.rule.minOrders,
          isCurrentlyValid,
          daysUntilExpiry: Math.ceil(
            (clientDiscountAssignment.rule.validTo.getTime() - now.getTime()) /
              (1000 * 60 * 60 * 24)
          ),
        },
      },
    };
  });
