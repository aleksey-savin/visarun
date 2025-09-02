import { transportTypeDeleteProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zDeleteTransportTypeTrpcInput = z.object({
  id: z.string().uuid(),
});

export const deleteTransportTypeTrpcRoute = transportTypeDeleteProcedure
  .input(zDeleteTransportTypeTrpcInput)
  .mutation(async ({ input, ctx }) => {
    // Check if transport type exists
    const existingTransportType = await ctx.prisma.transportType.findUnique({
      where: { id: input.id },
      include: {
        transports: true,
      },
    });

    if (!existingTransportType) {
      throw new Error('Transport type not found');
    }

    // Check if transport type has associated transports
    if (existingTransportType.transports.length > 0) {
      throw new Error('Cannot delete transport type that has associated transports');
    }

    // Delete the transport type
    await ctx.prisma.transportType.delete({
      where: { id: input.id },
    });

    return {
      success: true,
    };
  });
