import { orderReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zGetLatestClientOrderItemsTrpcInput = z.object({
  clientId: z.string().uuid(),
});

export const getLatestClientOrderItemsTrpcRoute = orderReadProcedure
  .input(zGetLatestClientOrderItemsTrpcInput)
  .query(async ({ input, ctx }) => {
    // Step 1: Get the client to extract userId
    const client = await ctx.prisma.client.findUnique({
      where: { id: input.clientId },
      select: {
        id: true,
        userId: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!client) {
      throw new Error('Client not found');
    }

    if (!client.userId) {
      throw new Error('Client is not associated with a user');
    }

    // Step 2: Get the latest order for the user with all client's items
    const latestOrder = await ctx.prisma.order.findFirst({
      where: { userId: client.userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        createdAt: true,
        status: true,
        comment: true,
        items: {
          where: {
            clientId: input.clientId,
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
                    abbreviation: true,
                    emoji: true,
                  },
                },
              },
            },
            VisaApplication: {
              include: {
                country: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                visaType: {
                  select: {
                    id: true,
                    name: true,
                    serviceCost: true,
                    processingMode: true,
                    processingUnit: true,
                    processingValueFixed: true,
                    processingValueMin: true,
                    processingValueMax: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!latestOrder) {
      throw new Error("No orders found for this client's user");
    }

    return {
      client: {
        id: client.id,
        firstName: client.firstName,
        lastName: client.lastName,
      },
      orderId: latestOrder.id,
      orderCreatedAt: latestOrder.createdAt,
      orderStatus: latestOrder.status,
      orderComment: latestOrder.comment,
      clientOrderItems: latestOrder.items,
    };
  });
