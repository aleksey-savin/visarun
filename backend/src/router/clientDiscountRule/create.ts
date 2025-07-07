import { clientDiscountRuleCreateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zCreateClientDiscountRuleTrpcInput = z.object({
  name: z.string().min(1).max(100),
  discountType: z.enum(['percent', 'fixed']),
  discountValue: z.number().min(0),
  appliesToService: z.enum(['visa', 'visarun', 'all']),
  appliesAutomatically: z.boolean().default(false),
  validFrom: z.date(),
  validTo: z.date(),
  minOrders: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  note: z.string().optional(),
});

export const createClientDiscountRuleTrpcRoute = clientDiscountRuleCreateProcedure
  .input(zCreateClientDiscountRuleTrpcInput)
  .mutation(async ({ input, ctx }) => {
    // Validate date range
    if (input.validFrom >= input.validTo) {
      throw new Error('Valid from date must be before valid to date');
    }

    // Validate discount value based on type
    if (input.discountType === 'percent' && input.discountValue > 100) {
      throw new Error('Percentage discount cannot exceed 100%');
    }

    // Check if a rule with the same name already exists
    const existingRule = await ctx.prisma.clientDiscountRule.findFirst({
      where: { name: input.name },
    });

    if (existingRule) {
      throw new Error('A discount rule with this name already exists');
    }

    // Create client discount rule
    const clientDiscountRule = await ctx.prisma.clientDiscountRule.create({
      data: {
        name: input.name,
        discountType: input.discountType,
        discountValue: input.discountValue,
        appliesToService: input.appliesToService,
        appliesAutomatically: input.appliesAutomatically,
        validFrom: input.validFrom,
        validTo: input.validTo,
        minOrders: input.minOrders,
        isActive: input.isActive,
        note: input.note,
      },
      include: {
        assignments: {
          include: {
            client: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
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
        },
        OrderItem: true,
      },
    });

    return {
      clientDiscountRule,
    };
  });
