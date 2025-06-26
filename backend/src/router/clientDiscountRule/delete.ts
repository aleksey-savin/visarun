import { clientDiscountRuleDeleteProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zDeleteClientDiscountRuleTrpcInput = z.object({
  id: z.string().uuid(),
});

export const deleteClientDiscountRuleTrpcRoute = clientDiscountRuleDeleteProcedure
  .input(zDeleteClientDiscountRuleTrpcInput)
  .mutation(async ({ input, ctx }) => {
    // Check if client discount rule exists
    const existingRule = await ctx.prisma.clientDiscountRule.findUnique({
      where: { id: input.id },
      include: {
        assignments: true,
        OrderItem: true,
      },
    });

    if (!existingRule) {
      throw new Error('Client discount rule not found');
    }

    // Check if rule has been used in orders
    if (existingRule.OrderItem.length > 0) {
      throw new Error('Cannot delete a discount rule that has been used in orders');
    }

    // Use transaction to delete rule and all its assignments
    await ctx.prisma.$transaction(async prisma => {
      // Delete all assignments for this rule
      await prisma.clientDiscountAssignment.deleteMany({
        where: { ruleId: input.id },
      });

      // Delete the rule itself
      await prisma.clientDiscountRule.delete({
        where: { id: input.id },
      });
    });

    return {
      success: true,
      message: 'Client discount rule deleted successfully',
    };
  });
