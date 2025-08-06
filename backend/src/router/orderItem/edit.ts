import { orderItemUpdateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zEditOrderItemTrpcInput = z.object({
  id: z.string().uuid(),
  serviceType: z.enum(['visa', 'visarun']).optional(),
  serviceTypeId: z.string().optional(),
  visaTypeId: z.string().uuid().optional(),
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

    // Get current order item with client info for surcharge calculation
    const currentOrderItem = await ctx.prisma.orderItem.findUnique({
      where: { id },
      include: {
        client: {
          include: {
            citizenship: true,
          },
        },
        VisaApplication: {
          select: {
            id: true,
            visaTypeId: true,
          },
        },
      },
    });

    if (!currentOrderItem) {
      throw new Error('Order item not found');
    }

    // Calculate citizenship surcharge for visa services
    let adjustedFinalPrice = updateData.finalPrice;
    let surchargeNote = updateData.note;

    if (updateData.serviceType === 'visa' || currentOrderItem.serviceType === 'visa') {
      const serviceTypeId = updateData.serviceTypeId || currentOrderItem.serviceTypeId;
      const visaTypeId = updateData.visaTypeId || currentOrderItem.VisaApplication?.[0]?.visaTypeId;

      if (currentOrderItem.client.citizenship && serviceTypeId) {
        // Look for applicable citizenship surcharge
        const surchargeQuery = {
          citizenshipId: currentOrderItem.client.citizenship.id,
          countryId: serviceTypeId,
        };

        let surcharge = null;

        // If visa type is specified, look for specific surcharge first
        if (visaTypeId) {
          surcharge = await ctx.prisma.visaCitizenshipSurcharge.findFirst({
            where: {
              ...surchargeQuery,
              isGlobal: false,
              visaTypes: {
                some: {
                  visaTypeId: visaTypeId,
                },
              },
            },
            include: {
              citizenship: true,
              country: true,
            },
          });
        }

        // If no specific surcharge found, look for global surcharge
        if (!surcharge) {
          surcharge = await ctx.prisma.visaCitizenshipSurcharge.findFirst({
            where: {
              ...surchargeQuery,
              isGlobal: true,
            },
            include: {
              citizenship: true,
              country: true,
            },
          });
        }

        // Calculate base values for final price calculation
        const basePrice =
          updateData.basePrice !== undefined ? updateData.basePrice : currentOrderItem.basePrice;
        const discountAmount =
          updateData.discountAmount !== undefined
            ? updateData.discountAmount
            : currentOrderItem.discountAmount;

        if (surcharge) {
          // Calculate finalPrice as basePrice - discountAmount + surcharge
          const priceAfterDiscount = Math.max(0, basePrice - discountAmount);
          adjustedFinalPrice = priceAfterDiscount + surcharge.surchargeAmount;

          // Add surcharge note if applicable
          if (surcharge.note) {
            const baseNote = updateData.note || currentOrderItem.note || '';
            surchargeNote = baseNote
              ? `${baseNote} | Citizenship surcharge: ${surcharge.note}`
              : `Citizenship surcharge: ${surcharge.note}`;
          }
        } else {
          // No surcharge found, but still recalculate finalPrice for visa services
          // This ensures finalPrice is properly set when updating visa-related fields
          adjustedFinalPrice = Math.max(0, basePrice - discountAmount);
        }
      }
    } else if (updateData.basePrice !== undefined || updateData.finalPrice !== undefined) {
      // For non-visa services or when no surcharge exists, just use the provided finalPrice
      adjustedFinalPrice = updateData.finalPrice;
    }

    // Prepare final update data (excluding visaTypeId which goes to VisaApplication)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { visaTypeId, ...orderItemUpdateData } = updateData;
    const finalUpdateData = {
      ...orderItemUpdateData,
      ...(adjustedFinalPrice !== undefined && { finalPrice: adjustedFinalPrice }),
      ...(surchargeNote !== undefined && { note: surchargeNote }),
    };

    // Update order item
    const orderItem = await ctx.prisma.orderItem.update({
      where: { id },
      data: finalUpdateData,
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

    // Update or create visa application if visaTypeId is provided and it's a visa service
    if (
      updateData.visaTypeId &&
      (updateData.serviceType === 'visa' || currentOrderItem.serviceType === 'visa')
    ) {
      const serviceTypeId = updateData.serviceTypeId || currentOrderItem.serviceTypeId;

      if (currentOrderItem.VisaApplication?.[0]) {
        // Update existing visa application
        await ctx.prisma.visaApplication.update({
          where: { id: currentOrderItem.VisaApplication[0].id },
          data: { visaTypeId: updateData.visaTypeId },
        });
      } else {
        // Create new visa application if none exists
        await ctx.prisma.visaApplication.create({
          data: {
            orderItemId: orderItem.id,
            submittedByAgent: false,
            countryId: serviceTypeId,
            status: 'pending',
            visaTypeId: updateData.visaTypeId,
          },
        });
      }
    }

    return {
      orderItem,
    };
  });
