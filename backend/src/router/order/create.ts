import { orderCreateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zCreateOrderTrpcInput = z.object({
  userId: z.string().uuid(),
  status: z.enum(['draft', 'submitted', 'paid', 'cancelled']).optional().default('draft'),
});

export const createOrderTrpcRoute = orderCreateProcedure
  .input(zCreateOrderTrpcInput)
  .mutation(async ({ input, ctx }) => {
    // Check if user exists
    const user = await ctx.prisma.user.findUnique({
      where: { id: input.userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Create order
    const order = await ctx.prisma.order.create({
      data: {
        userId: input.userId,
        status: input.status,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            middleName: true,
            lastName: true,
            email: true,
          },
        },
        items: {
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
            discountRule: {
              select: {
                id: true,
                name: true,
                discountType: true,
                discountValue: true,
              },
            },
          },
        },
      },
    });

    return {
      order,
    };
  });
