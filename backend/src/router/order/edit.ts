import { orderUpdateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zEditOrderTrpcInput = z.object({
  id: z.string().uuid(),
  updatedAt: z.string().datetime().optional(),
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
    .optional(),
});

export const editOrderTrpcRoute = orderUpdateProcedure
  .input(zEditOrderTrpcInput)
  .mutation(async ({ input, ctx }) => {
    const { id, ...updateData } = input;

    // Check if order exists
    const existingOrder = await ctx.prisma.order.findUnique({
      where: { id },
    });

    if (!existingOrder) {
      throw new Error('Order not found');
    }

    const { clients, ...restUpdateData } = updateData;

    if (clients.length > 0) {
      await ctx.prisma.$transaction(async prisma => {
        // 1. Remove clients that are no longer in the input
        await prisma.orderClient.deleteMany({
          where: {
            orderId: id,
            clientId: { notIn: clients },
          },
        });

        // 2. Add new ones (skip existing)
        for (const clientId of clients) {
          await prisma.orderClient.upsert({
            where: {
              orderId_clientId: { orderId: id, clientId },
            },
            update: {}, // do nothing if exists
            create: { orderId: id, clientId },
          });
        }
      });
    }

    // Update order
    const order = await ctx.prisma.order.update({
      where: { id },
      data: {
        ...restUpdateData,
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
                    abbreviation: true,
                    favourite: true,
                    emoji: true,
                    blacklisted: true,
                    surcharges: true,
                    visaFree: true,
                    RequirementCitizenship: true,
                  },
                },
              },
            },
          },
          orderBy: {
            id: 'asc',
          },
        },
      },
    });

    return {
      order,
    };
  });
