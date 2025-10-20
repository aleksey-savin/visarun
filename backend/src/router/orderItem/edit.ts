import { orderItemUpdateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zEditOrderItemTrpcInput = z.object({
  id: z.string().uuid(),
  serviceType: z.enum(['visa', 'visarun', 'acceleration']).optional(),
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
        VisaApplication: true,
      },
    });

    return {
      orderItem,
    };
  });
