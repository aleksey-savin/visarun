import { userUpdateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';
import { setPrimaryClient } from '../../utils/clientPrimary.js';

export const zSetPrimaryClientTrpcInput = z.object({
  clientId: z.string().uuid(),
});

export const setPrimaryClientTrpcRoute = userUpdateProcedure
  .input(zSetPrimaryClientTrpcInput)
  .mutation(async ({ input, ctx }) => {
    const { clientId } = input;

    // Check if client exists
    const client = await ctx.prisma.client.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        userId: true,
        isPrimary: true,
      },
    });

    if (!client) {
      throw new Error('Client not found');
    }

    // If already primary, no need to do anything
    if (client.isPrimary) {
      return { success: true, message: 'Client is already primary' };
    }

    // Set as primary using utility function
    await setPrimaryClient(ctx.prisma, clientId, client.userId || undefined);

    // Return the updated client
    const updatedClient = await ctx.prisma.client.findUnique({
      where: { id: clientId },
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
        citizenship: {
          select: {
            id: true,
            name: true,
          },
        },
        documents: {
          orderBy: {
            uploadedAt: 'desc',
          },
          include: {
            requirement: {
              select: {
                id: true,
                title: true,
                description: true,
                serviceType: true,
                inputType: true,
              },
            },
            uploadedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return {
      success: true,
      client: updatedClient,
    };
  });
