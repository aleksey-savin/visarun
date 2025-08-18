import { orderCreateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zCreateOrderTrpcInput = z.object({
  userId: z.string().uuid(),
  clients: z.array(z.string().uuid()).optional().default([]),
  status: z
    .enum([
      'draft',
      'personal_data_verification',
      'payment_pending',
      'submitted',
      'completed',
      'cancelled',
    ])
    .optional()
    .default('draft'),
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

    // Validate that all provided client IDs exist
    if (input.clients.length > 0) {
      const existingClients = await ctx.prisma.client.findMany({
        where: { id: { in: input.clients } },
        select: { id: true },
      });

      if (existingClients.length !== input.clients.length) {
        throw new Error('One or more client IDs are invalid');
      }
    }

    // Create order
    const order = await ctx.prisma.order.create({
      data: {
        userId: input.userId,
        status: input.status,
        // Create OrderClient relationships
        clients: {
          create: input.clients.map(clientId => ({
            clientId,
          })),
        },
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
        clients: {
          select: {
            id: true,
            client: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                citizenship: {
                  select: {
                    id: true,
                    name: true,
                    abbreviation: true,
                    blacklisted: true,
                    surcharges: true,
                    visaFree: true,
                    RequirementCitizenship: true,
                  },
                },
              },
            },
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
