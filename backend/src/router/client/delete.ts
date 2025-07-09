import { userDeleteProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zDeleteClientTrpcInput = z.object({
  id: z.string().uuid(),
});

export const deleteClientTrpcRoute = userDeleteProcedure
  .input(zDeleteClientTrpcInput)
  .mutation(async ({ input, ctx }) => {
    const { id } = input;

    // Check if client exists
    const existingClient = await ctx.prisma.client.findUnique({
      where: { id },
      include: {
        documents: true,
      },
    });

    if (!existingClient) {
      throw new Error('Client not found');
    }

    // Delete all associated documents first
    if (existingClient.documents.length > 0) {
      await ctx.prisma.clientDocument.deleteMany({
        where: { clientId: id },
      });
    }

    // Delete the client
    await ctx.prisma.client.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Client deleted successfully',
    };
  });
