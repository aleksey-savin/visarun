import { transportUpdateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zEditTransportTrpcInput = z.object({
  id: z.string().uuid(),
  transportTypeId: z.string().uuid('Invalid transport type ID'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  seatCount: z.number().int().positive('Seat count must be a positive integer').optional(),
});

export const editTransportTrpcRoute = transportUpdateProcedure
  .input(zEditTransportTrpcInput)
  .mutation(async ({ input, ctx }) => {
    // Check if transport exists
    const existingTransport = await ctx.prisma.transport.findUnique({
      where: { id: input.id },
    });

    if (!existingTransport) {
      throw new Error('Transport not found');
    }

    // Check if transport type exists
    const transportType = await ctx.prisma.transportType.findUnique({
      where: { id: input.transportTypeId },
    });

    if (!transportType) {
      throw new Error('Transport type not found');
    }

    // Check if another transport with the same name exists
    const duplicateTransport = await ctx.prisma.transport.findUnique({
      where: {
        name: input.name,
        NOT: { id: input.id },
      },
    });

    if (duplicateTransport) {
      throw new Error('Transport with this name already exists');
    }

    // Update the transport
    const transport = await ctx.prisma.transport.update({
      where: { id: input.id },
      data: {
        transportTypeId: input.transportTypeId,
        name: input.name,
        description: input.description,
        seatCount: input.seatCount,
      },
      include: {
        transportType: true,
      },
    });

    return {
      transport,
    };
  });
