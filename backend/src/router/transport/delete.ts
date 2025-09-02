import { transportDeleteProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zDeleteTransportTrpcInput = z.object({
  id: z.string().uuid(),
});

export const deleteTransportTrpcRoute = transportDeleteProcedure
  .input(zDeleteTransportTrpcInput)
  .mutation(async ({ input, ctx }) => {
    // Check if transport exists
    const existingTransport = await ctx.prisma.transport.findUnique({
      where: { id: input.id },
    });

    if (!existingTransport) {
      throw new Error('Transport not found');
    }

    // TODO: Add checks for related entities if needed
    // For example, check if transport is used in routes, bookings, etc.

    // Delete the transport
    await ctx.prisma.transport.delete({
      where: { id: input.id },
    });

    return {
      success: true,
    };
  });
