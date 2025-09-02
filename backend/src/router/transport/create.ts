import { transportCreateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zCreateTransportTrpcInput = z.object({
  transportTypeId: z.string().uuid('Invalid transport type ID'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  seatCount: z.number().int().positive('Seat count must be a positive integer').optional(),
});

export const createTransportTrpcRoute = transportCreateProcedure
  .input(zCreateTransportTrpcInput)
  .mutation(async ({ input, ctx }) => {
    // Check if transport type exists
    const transportType = await ctx.prisma.transportType.findUnique({
      where: { id: input.transportTypeId },
    });

    if (!transportType) {
      throw new Error('Transport type not found');
    }

    // Check if transport with the same name already exists
    const existingTransport = await ctx.prisma.transport.findUnique({
      where: { name: input.name },
    });

    if (existingTransport) {
      throw new Error('Transport with this name already exists');
    }

    // Create the transport
    const transport = await ctx.prisma.transport.create({
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
