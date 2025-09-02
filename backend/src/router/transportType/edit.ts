import { transportTypeUpdateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zEditTransportTypeTrpcInput = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Name is required'),
  icon: z.string().optional(),
});

export const editTransportTypeTrpcRoute = transportTypeUpdateProcedure
  .input(zEditTransportTypeTrpcInput)
  .mutation(async ({ input, ctx }) => {
    // Check if transport type exists
    const existingTransportType = await ctx.prisma.transportType.findUnique({
      where: { id: input.id },
    });

    if (!existingTransportType) {
      throw new Error('Transport type not found');
    }

    // Check if another transport type with the same name exists
    const duplicateTransportType = await ctx.prisma.transportType.findUnique({
      where: {
        name: input.name,
        NOT: { id: input.id },
      },
    });

    if (duplicateTransportType) {
      throw new Error('Transport type with this name already exists');
    }

    // Update the transport type
    const transportType = await ctx.prisma.transportType.update({
      where: { id: input.id },
      data: {
        name: input.name,
        icon: input.icon,
      },
    });

    return {
      transportType,
    };
  });
