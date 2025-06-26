import { clientDiscountAssignmentDeleteProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zDeleteClientDiscountAssignmentTrpcInput = z.object({
  id: z.string().uuid(),
});

export const deleteClientDiscountAssignmentTrpcRoute = clientDiscountAssignmentDeleteProcedure
  .input(zDeleteClientDiscountAssignmentTrpcInput)
  .mutation(async ({ input, ctx }) => {
    // Check if client discount assignment exists
    const existingAssignment = await ctx.prisma.clientDiscountAssignment.findUnique({
      where: { id: input.id },
      include: {
        client: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        rule: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!existingAssignment) {
      throw new Error('Client discount assignment not found');
    }

    // Check if the assignment has been used in orders
    const usageCount = await ctx.prisma.orderItem.count({
      where: {
        clientId: existingAssignment.clientId,
        discountRuleId: existingAssignment.ruleId,
      },
    });

    if (usageCount > 0) {
      throw new Error(
        `Cannot delete assignment - this discount rule has been used ${usageCount} time(s) by ${existingAssignment.client.firstName} ${existingAssignment.client.lastName}`
      );
    }

    // Delete the assignment
    await ctx.prisma.clientDiscountAssignment.delete({
      where: { id: input.id },
    });

    return {
      success: true,
      message: `Discount rule "${existingAssignment.rule.name}" assignment removed from client ${existingAssignment.client.firstName} ${existingAssignment.client.lastName}`,
    };
  });
