import { transportTypeCreateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zCreateTransportTypeTrpcInput = z.object({
  name: z.string().min(1, 'Name is required'),
  icon: z.string().optional(),
});

export const createTransportTypeTrpcRoute = transportTypeCreateProcedure
  .input(zCreateTransportTypeTrpcInput)
  .mutation(async ({ input, ctx }) => {
    // Check if transport type with the same name already exists
    const existingTransportType = await ctx.prisma.transportType.findUnique({
      where: { name: input.name },
    });

    if (existingTransportType) {
      throw new Error('Transport type with this name already exists');
    }

    // Create the transport type
    const transportType = await ctx.prisma.transportType.create({
      data: {
        name: input.name,
        icon: input.icon,
      },
    });

    return {
      transportType,
    };
  });
