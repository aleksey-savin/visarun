import { clientDiscountRuleUpdateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zEditClientDiscountRuleTrpcInput = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  discountType: z.enum(['percent', 'fixed']).optional(),
  discountValue: z.number().min(0).optional(),
  appliesToService: z.enum(['visa', 'visarun', 'all']).optional(),
  appliesAutomatically: z.boolean().optional(),
  validFrom: z.date().optional(),
  validTo: z.date().optional(),
  minOrders: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  note: z.string().optional().nullable(),
});

export const editClientDiscountRuleTrpcRoute = clientDiscountRuleUpdateProcedure
  .input(zEditClientDiscountRuleTrpcInput)
  .mutation(async ({ input, ctx }) => {
    const { id, ...updateData } = input;

    // Check if client discount rule exists
    const existingRule = await ctx.prisma.clientDiscountRule.findUnique({
      where: { id },
      include: {
        OrderItem: true,
      },
    });

    if (!existingRule) {
      throw new Error('Client discount rule not found');
    }

    // Validate date range if dates are being updated
    const validFrom = updateData.validFrom || existingRule.validFrom;
    const validTo = updateData.validTo || existingRule.validTo;

    if (validFrom >= validTo) {
      throw new Error('Valid from date must be before valid to date');
    }

    // Validate discount value based on type
    const discountType = updateData.discountType || existingRule.discountType;
    const discountValue = updateData.discountValue || existingRule.discountValue;

    if (discountType === 'percent' && discountValue > 100) {
      throw new Error('Percentage discount cannot exceed 100%');
    }

    // Check if name is being updated and if it conflicts with existing rules
    if (updateData.name && updateData.name !== existingRule.name) {
      const nameConflict = await ctx.prisma.clientDiscountRule.findFirst({
        where: {
          name: updateData.name,
          id: { not: id },
        },
      });

      if (nameConflict) {
        throw new Error('A discount rule with this name already exists');
      }
    }

    // Check if rule has been used and prevent certain changes
    if (existingRule.OrderItem.length > 0) {
      // Prevent changing discount type or value if rule has been used
      if (updateData.discountType && updateData.discountType !== existingRule.discountType) {
        throw new Error('Cannot change discount type for a rule that has been used');
      }
      if (updateData.discountValue && updateData.discountValue !== existingRule.discountValue) {
        throw new Error('Cannot change discount value for a rule that has been used');
      }
      if (
        updateData.appliesToService &&
        updateData.appliesToService !== existingRule.appliesToService
      ) {
        throw new Error('Cannot change service applicability for a rule that has been used');
      }
    }

    // Update client discount rule
    const clientDiscountRule = await ctx.prisma.clientDiscountRule.update({
      where: { id },
      data: updateData,
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
        OrderItem: true,
      },
    });

    return {
      clientDiscountRule,
    };
  });
