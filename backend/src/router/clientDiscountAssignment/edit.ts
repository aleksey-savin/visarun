import { clientDiscountAssignmentUpdateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zEditClientDiscountAssignmentTrpcInput = z.object({
  id: z.string().uuid(),
  note: z.string().optional().nullable(),
});

export const editClientDiscountAssignmentTrpcRoute = clientDiscountAssignmentUpdateProcedure
  .input(zEditClientDiscountAssignmentTrpcInput)
  .mutation(async ({ input, ctx }) => {
    const { id, ...updateData } = input;

    // Check if client discount assignment exists
    const existingAssignment = await ctx.prisma.clientDiscountAssignment.findUnique({
      where: { id },
      include: {
        rule: true,
      },
    });

    if (!existingAssignment) {
      throw new Error('Client discount assignment not found');
    }

    // Check if the rule has been used in orders - restrict modifications if it has been used
    const usageCount = await ctx.prisma.orderItem.count({
      where: {
        clientId: existingAssignment.clientId,
        discountRuleId: existingAssignment.ruleId,
      },
    });

    // For now, we only allow editing the note field
    // This is a business decision - assignments should be relatively immutable once created
    // If more complex editing is needed, it should be done by deleting and recreating the assignment

    // Update client discount assignment
    const clientDiscountAssignment = await ctx.prisma.clientDiscountAssignment.update({
      where: { id },
      data: updateData,
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

    return {
      clientDiscountAssignment: {
        ...clientDiscountAssignment,
        metadata: {
          usageCount,
          hasBeenUsed: usageCount > 0,
        },
      },
    };
  });
