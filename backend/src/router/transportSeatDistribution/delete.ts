import { transportUpdateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zDeleteTransportSeatDistributionTrpcInput = z.object({
  transportId: z.string().uuid('Invalid transport ID'),
  seatClassId: z.string().uuid('Invalid seat class ID').optional(),
});

export const deleteTransportSeatDistributionTrpcRoute = transportUpdateProcedure
  .input(zDeleteTransportSeatDistributionTrpcInput)
  .mutation(async ({ input, ctx }) => {
    // Check if transport exists
    const transport = await ctx.prisma.transport.findUnique({
      where: { id: input.transportId },
    });

    if (!transport) {
      throw new Error('Transport not found');
    }

    // If seatClassId is provided, delete specific distribution
    // Otherwise, delete all distributions for the transport
    const whereClause = input.seatClassId
      ? {
          transportId: input.transportId,
          seatClassId: input.seatClassId,
        }
      : {
          transportId: input.transportId,
        };

    // Check if the distribution exists before deletion
    if (input.seatClassId) {
      const existingDistribution = await ctx.prisma.transportSeatDistribution.findUnique({
        where: {
          transportId_seatClassId: {
            transportId: input.transportId,
            seatClassId: input.seatClassId,
          },
        },
      });

      if (!existingDistribution) {
        throw new Error('Seat distribution not found');
      }
    }

    // Delete the distribution(s)
    const deleteResult = await ctx.prisma.transportSeatDistribution.deleteMany({
      where: whereClause,
    });

    // Get remaining distributions for this transport
    const remainingDistributions = await ctx.prisma.transportSeatDistribution.findMany({
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

    // Calculate summary statistics
    const totalAllocatedSeats = remainingDistributions.reduce(
      (sum, dist) => sum + dist.seatCount,
      0
    );

    return {
      deletedCount: deleteResult.count,
      remainingDistributions,
      summary: {
        totalAllocatedSeats,
        totalCapacity: transport.seatCount || 0,
        remainingSeats: (transport.seatCount || 0) - totalAllocatedSeats,
      },
    };
  });
