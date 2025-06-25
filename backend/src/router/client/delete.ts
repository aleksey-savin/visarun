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
        passports: true,
      },
    });

    if (!existingClient) {
      throw new Error('Client not found');
    }

    // Delete all associated passports first
    if (existingClient.passports.length > 0) {
      await ctx.prisma.clientPassport.deleteMany({
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
