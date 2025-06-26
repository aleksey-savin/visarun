import { orderItemCreateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zCreateOrderItemTrpcInput = z.object({
  orderId: z.string().uuid(),
  clientId: z.string().uuid(),
  serviceType: z.enum(['visa', 'visarun']),
  serviceTypeId: z.string(),
  discountAppliedType: z.enum(['manual', 'rule']).optional(),
  discountRuleId: z.string().uuid().optional(),
  discountAmount: z.number().min(0).default(0),
  discountComment: z.string().optional(),
  note: z.string().optional(),
  basePrice: z.number().min(0),
  finalPrice: z.number().min(0),
});

export const createOrderItemTrpcRoute = orderItemCreateProcedure
  .input(zCreateOrderItemTrpcInput)
  .mutation(async ({ input, ctx }) => {
    // Check if order exists
    const order = await ctx.prisma.order.findUnique({
      where: { id: input.orderId },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Check if client exists
    const client = await ctx.prisma.client.findUnique({
      where: { id: input.clientId },
    });

    if (!client) {
      throw new Error('Client not found');
    }

    // Check if discount rule exists if provided
    if (input.discountRuleId) {
      const discountRule = await ctx.prisma.clientDiscountRule.findUnique({
        where: { id: input.discountRuleId },
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
      if (
        discountRule.appliesToService !== 'all' &&
        discountRule.appliesToService !== input.serviceType
      ) {
        throw new Error('Discount rule does not apply to this service type');
      }
    }

    // Validate discount applied type consistency
    if (input.discountAppliedType === 'rule' && !input.discountRuleId) {
      throw new Error('Discount rule ID is required when discount applied type is "rule"');
    }

    if (input.discountAppliedType === 'manual' && input.discountRuleId) {
      throw new Error(
        'Discount rule ID should not be provided when discount applied type is "manual"'
      );
    }

    // Create order item
    const orderItem = await ctx.prisma.orderItem.create({
      data: {
        orderId: input.orderId,
        clientId: input.clientId,
        serviceType: input.serviceType,
        serviceTypeId: input.serviceTypeId,
        discountAppliedType: input.discountAppliedType,
        discountRuleId: input.discountRuleId,
        discountAmount: input.discountAmount,
        discountComment: input.discountComment,
        note: input.note,
        basePrice: input.basePrice,
        finalPrice: input.finalPrice,
      },
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
