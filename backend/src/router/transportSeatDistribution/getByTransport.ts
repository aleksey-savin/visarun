import { transportReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zGetTransportSeatDistributionTrpcInput = z.object({
  transportId: z.string().uuid('Invalid transport ID'),
});

export const getTransportSeatDistributionTrpcRoute = transportReadProcedure
  .input(zGetTransportSeatDistributionTrpcInput)
  .query(async ({ input, ctx }) => {
    // Check if transport exists
    const transport = await ctx.prisma.transport.findUnique({
      where: { id: input.transportId },
      include: {
        transportType: true,
      },
    });

    if (!transport) {
      throw new Error('Transport not found');
    }

    // Get seat distribution for this transport
    const seatDistribution = await ctx.prisma.transportSeatDistribution.findMany({
      where: { transportId: input.transportId },
      include: {
        seatClass: true,
      },
      orderBy: {
        seatClass: {
          name: 'asc',
        },
      },
    });

    // Calculate total allocated seats
    const totalAllocatedSeats = seatDistribution.reduce(
      (sum, distribution) => sum + distribution.seatCount,
      0
    );

    // Get all available seat classes for potential distribution
    const allSeatClasses = await ctx.prisma.seatClass.findMany({
      orderBy: {
        name: 'asc',
      },
    });

    return {
      transport,
      seatDistribution,
      totalAllocatedSeats,
      totalCapacity: transport.seatCount || 0,
      remainingSeats: (transport.seatCount || 0) - totalAllocatedSeats,
      availableSeatClasses: allSeatClasses,
    };
  });
