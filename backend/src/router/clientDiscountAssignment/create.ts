import { clientDiscountAssignmentCreateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zCreateClientDiscountAssignmentTrpcInput = z.object({
  clientId: z.string().uuid(),
  ruleId: z.string().uuid(),
  assignedByUserId: z.string().uuid(),
  note: z.string().optional(),
});

export const createClientDiscountAssignmentTrpcRoute = clientDiscountAssignmentCreateProcedure
  .input(zCreateClientDiscountAssignmentTrpcInput)
  .mutation(async ({ input, ctx }) => {
    // Check if client exists
    const client = await ctx.prisma.client.findUnique({
      where: { id: input.clientId },
    });

    if (!client) {
      throw new Error('Client not found');
    }

    // Check if discount rule exists
    const discountRule = await ctx.prisma.clientDiscountRule.findUnique({
      where: { id: input.ruleId },
    });

    if (!discountRule) {
      throw new Error('Discount rule not found');
    }

    // Check if discount rule is active
    if (!discountRule.isActive) {
      throw new Error('Cannot assign an inactive discount rule');
    }

    // Check if discount rule is valid for the current date
    const now = new Date();
    if (now < discountRule.validFrom || now > discountRule.validTo) {
      throw new Error('Cannot assign a discount rule that is not valid for the current date');
    }

    // Check if user exists
    const assignedByUser = await ctx.prisma.user.findUnique({
      where: { id: input.assignedByUserId },
    });

    if (!assignedByUser) {
      throw new Error('Assigned by user not found');
    }

    // Check if assignment already exists
    const existingAssignment = await ctx.prisma.clientDiscountAssignment.findFirst({
      where: {
        clientId: input.clientId,
        ruleId: input.ruleId,
      },
    });

    if (existingAssignment) {
      throw new Error('Client is already assigned to this discount rule');
    }

    // Create client discount assignment
    const clientDiscountAssignment = await ctx.prisma.clientDiscountAssignment.create({
      data: {
        clientId: input.clientId,
        ruleId: input.ruleId,
        assignedByUserId: input.assignedByUserId,
        assignedAt: new Date(),
        note: input.note,
      },
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
            validFrom: true,
            validTo: true,
            isActive: true,
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
      clientDiscountAssignment,
    };
  });
