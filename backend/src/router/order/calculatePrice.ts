import { orderReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zCalculateOrderPriceTrpcInput = z.object({
  items: z.array(
    z.object({
      clientId: z.string().uuid(),
      serviceType: z.enum(['visa', 'visarun']),
      serviceTypeId: z.string(),
      basePrice: z.number().min(0),
      discountRuleId: z.string().uuid().optional(),
      manualDiscountAmount: z.number().min(0).optional().default(0),
    })
  ),
});

export const calculateOrderPriceTrpcRoute = orderReadProcedure
  .input(zCalculateOrderPriceTrpcInput)
  .query(async ({ input, ctx }) => {
    const calculatedItems = [];
    let totalBasePrice = 0;
    let totalDiscountAmount = 0;
    let totalFinalPrice = 0;

    for (const item of input.items) {
      // Check if client exists
      const client = await ctx.prisma.client.findUnique({
        where: { id: item.clientId },
        include: {
          citizenship: true,
        },
      });

      if (!client) {
        throw new Error(`Client with ID ${item.clientId} not found`);
      }

      let discountAmount = item.manualDiscountAmount || 0;
      let discountAppliedType: 'manual' | 'rule' | null = null;
      let appliedDiscountRule = null;

      // Calculate discount if discount rule is provided
      if (item.discountRuleId) {
        const discountRule = await ctx.prisma.clientDiscountRule.findUnique({
          where: { id: item.discountRuleId },
        });

        if (!discountRule) {
          throw new Error(`Discount rule with ID ${item.discountRuleId} not found`);
        }

        // Check if discount rule is active
        if (!discountRule.isActive) {
          throw new Error(`Discount rule "${discountRule.name}" is not active`);
        }

        // Check if discount rule is valid for the current date
        const now = new Date();
        if (now < discountRule.validFrom || now > discountRule.validTo) {
          throw new Error(`Discount rule "${discountRule.name}" is not valid for the current date`);
        }

        // Check if discount rule applies to the service type
        if (
          discountRule.appliesToService !== 'all' &&
          discountRule.appliesToService !== item.serviceType
        ) {
          throw new Error(
            `Discount rule "${discountRule.name}" does not apply to service type "${item.serviceType}"`
          );
        }

        // Check if client is assigned to this discount rule (if not automatically applied)
        if (!discountRule.appliesAutomatically) {
          const assignment = await ctx.prisma.clientDiscountAssignment.findFirst({
            where: {
              clientId: item.clientId,
              ruleId: item.discountRuleId,
            },
          });

          if (!assignment) {
            throw new Error(`Client is not assigned to discount rule "${discountRule.name}"`);
          }
        }

        // Calculate discount amount based on discount type
        if (discountRule.discountType === 'percent') {
          discountAmount = (item.basePrice * discountRule.discountValue) / 100;
        } else if (discountRule.discountType === 'fixed') {
          discountAmount = discountRule.discountValue;
        }

        // Ensure discount doesn't exceed base price
        discountAmount = Math.min(discountAmount, item.basePrice);

        discountAppliedType = 'rule';
        appliedDiscountRule = {
          id: discountRule.id,
          name: discountRule.name,
          discountType: discountRule.discountType,
          discountValue: discountRule.discountValue,
        };
      } else if (item.manualDiscountAmount && item.manualDiscountAmount > 0) {
        discountAppliedType = 'manual';
      }

      const finalPrice = Math.max(0, item.basePrice - discountAmount);

      const calculatedItem = {
        clientId: item.clientId,
        client: {
          id: client.id,
          firstName: client.firstName,
          lastName: client.lastName,
          citizenship: client.citizenship
            ? {
                id: client.citizenship.id,
                name: client.citizenship.name,
              }
            : null,
        },
        serviceType: item.serviceType,
        serviceTypeId: item.serviceTypeId,
        basePrice: item.basePrice,
        discountAmount,
        discountAppliedType,
        appliedDiscountRule,
        finalPrice,
        savings: item.basePrice - finalPrice,
      };

      calculatedItems.push(calculatedItem);
      totalBasePrice += item.basePrice;
      totalDiscountAmount += discountAmount;
      totalFinalPrice += finalPrice;
    }

    return {
      items: calculatedItems,
      totals: {
        basePrice: totalBasePrice,
        discountAmount: totalDiscountAmount,
        finalPrice: totalFinalPrice,
        totalSavings: totalBasePrice - totalFinalPrice,
        discountPercentage: totalBasePrice > 0 ? (totalDiscountAmount / totalBasePrice) * 100 : 0,
      },
    };
  });
