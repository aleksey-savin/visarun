import { orderItemUpdateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zEditOrderItemTrpcInput = z.object({
  id: z.string().uuid(),
  serviceType: z.enum(['visa', 'visarun']).optional(),
  serviceTypeId: z.string().optional(),
  discountAppliedType: z.enum(['manual', 'rule']).optional(),
  discountRuleId: z.string().uuid().optional().nullable(),
  discountAmount: z.number().min(0).optional(),
  discountComment: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  basePrice: z.number().min(0).optional(),
  finalPrice: z.number().min(0).optional(),
});

export const editOrderItemTrpcRoute = orderItemUpdateProcedure
  .input(zEditOrderItemTrpcInput)
  .mutation(async ({ input, ctx }) => {
    const { id, ...updateData } = input;

    // Check if order item exists
    const existingOrderItem = await ctx.prisma.orderItem.findUnique({
      where: { id },
      include: {
        order: true,
      },
    });

    if (!existingOrderItem) {
      throw new Error('Order item not found');
    }

    // Check if order is in draft status (can only edit draft orders)
    if (existingOrderItem.order.status !== 'draft') {
      throw new Error('Can only edit order items in draft orders');
    }

    // Check if discount rule exists if provided
    if (updateData.discountRuleId) {
      const discountRule = await ctx.prisma.clientDiscountRule.findUnique({
        where: { id: updateData.discountRuleId },
      });

      if (!discountRule) {
        throw new Error('Discount rule not found');
      }

      // Check if discount rule is active
      if (!discountRule.isActive) {
        throw new Error('Discount rule is not active');
      }

      // Check if discount rule is valid for the current date
      const now = new Date();
      if (now < discountRule.validFrom || now > discountRule.validTo) {
        throw new Error('Discount rule is not valid for the current date');
      }

      // Check if discount rule applies to the service type
      const serviceType = updateData.serviceType || existingOrderItem.serviceType;
      if (
        discountRule.appliesToService !== 'all' &&
        discountRule.appliesToService !== serviceType
      ) {
        throw new Error('Discount rule does not apply to this service type');
      }
    }

    // Validate discount applied type consistency
    if (updateData.discountAppliedType === 'rule' && !updateData.discountRuleId) {
      throw new Error('Discount rule ID is required when discount applied type is "rule"');
    }

    if (updateData.discountAppliedType === 'manual' && updateData.discountRuleId) {
      throw new Error(
        'Discount rule ID should not be provided when discount applied type is "manual"'
      );
    }

    // Update order item
    const orderItem = await ctx.prisma.orderItem.update({
      where: { id },
      data: updateData,
      include: {
        order: {
          select: {
            id: true,
            status: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                firstName: true,
                middleName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
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
        discountRule: {
          select: {
            id: true,
            name: true,
            discountType: true,
            discountValue: true,
            appliesToService: true,
          },
        },
      },
    });

    return {
      orderItem,
    };
  });
