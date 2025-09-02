import { transportReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zGetTransportTrpcInput = z.object({
  id: z.string().uuid(),
});

export const getTransportTrpcRoute = transportReadProcedure
  .input(zGetTransportTrpcInput)
  .query(async ({ input, ctx }) => {
    const transport = await ctx.prisma.transport.findUnique({
      where: { id: input.id },
      include: {
        transportType: true,
        seatDistribution: {
          include: {
            seatClass: true,
          },
          orderBy: {
            seatClass: {
              name: 'asc',
            },
          },
        },
      },
    });

    if (!transport) {
      throw new Error('Transport not found');
    }

    // Calculate summary statistics
    const totalAllocatedSeats = transport.seatDistribution.reduce(
      (sum, dist) => sum + dist.seatCount,
      0
    );

    return {
      transport,
      seatDistributionSummary: {
        totalAllocatedSeats,
        totalCapacity: transport.seatCount || 0,
        remainingSeats: (transport.seatCount || 0) - totalAllocatedSeats,
      },
    };
  });
