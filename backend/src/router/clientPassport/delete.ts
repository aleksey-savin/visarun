import { userDeleteProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zDeleteClientPassportTrpcInput = z.object({
  id: z.string().uuid(),
});

export const deleteClientPassportTrpcRoute = userDeleteProcedure
  .input(zDeleteClientPassportTrpcInput)
  .mutation(async ({ input, ctx }) => {
    const { id } = input;

    // Check if client passport exists
    const existingClientPassport = await ctx.prisma.clientPassport.findUnique({
      where: { id },
    });

    if (!existingClientPassport) {
      throw new Error('Client passport not found');
    }

    // Delete the client passport
    await ctx.prisma.clientPassport.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Client passport deleted successfully',
    };
  });
