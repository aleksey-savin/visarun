import { transportTypeReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zGetTransportTypeTrpcInput = z.object({
  id: z.string().uuid(),
});

export const getTransportTypeTrpcRoute = transportTypeReadProcedure
  .input(zGetTransportTypeTrpcInput)
  .query(async ({ input, ctx }) => {
    const transportType = await ctx.prisma.transportType.findUnique({
      where: { id: input.id },
      include: {
        transports: {
          orderBy: {
            name: 'asc',
          },
        },
      },
    });

    if (!transportType) {
      throw new Error('Transport type not found');
    }

    return {
      transportType,
    };
  });
