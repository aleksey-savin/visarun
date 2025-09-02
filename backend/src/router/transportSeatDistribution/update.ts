import { transportUpdateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zUpdateTransportSeatDistributionTrpcInput = z.object({
  transportId: z.string().uuid('Invalid transport ID'),
  distributions: z.array(
    z.object({
      seatClassId: z.string().uuid('Invalid seat class ID'),
      seatCount: z.number().int().min(0, 'Seat count cannot be negative'),
    })
  ),
});

export const updateTransportSeatDistributionTrpcRoute = transportUpdateProcedure
  .input(zUpdateTransportSeatDistributionTrpcInput)
  .mutation(async ({ input, ctx }) => {
    // Check if transport exists
    const transport = await ctx.prisma.transport.findUnique({
      where: { id: input.transportId },
    });

    if (!transport) {
      throw new Error('Transport not found');
    }

    // Calculate total seats to be allocated
    const totalAllocatedSeats = input.distributions.reduce((sum, dist) => sum + dist.seatCount, 0);

    // Validate that total allocated seats don't exceed transport capacity
    if (transport.seatCount && totalAllocatedSeats > transport.seatCount) {
      throw new Error(
        `Total allocated seats (${totalAllocatedSeats}) cannot exceed transport capacity (${transport.seatCount})`
      );
    }

    // Validate that all seat classes exist
    const seatClassIds = input.distributions.map(d => d.seatClassId);
    const existingSeatClasses = await ctx.prisma.seatClass.findMany({
      where: { id: { in: seatClassIds } },
    });

    if (existingSeatClasses.length !== seatClassIds.length) {
      throw new Error('One or more seat classes not found');
    }

    // Check for duplicate seat classes in input
    const uniqueSeatClassIds = new Set(seatClassIds);
    if (uniqueSeatClassIds.size !== seatClassIds.length) {
      throw new Error('Duplicate seat classes in distribution');
    }

    // Use transaction to ensure data consistency
    const result = await ctx.prisma.$transaction(async prisma => {
      // Delete existing distributions for this transport
      await prisma.transportSeatDistribution.deleteMany({
        where: { transportId: input.transportId },
      });

      // Create new distributions (only for non-zero seat counts)
      const distributionsToCreate = input.distributions.filter(d => d.seatCount > 0);

      if (distributionsToCreate.length > 0) {
        await prisma.transportSeatDistribution.createMany({
          data: distributionsToCreate.map(dist => ({
            transportId: input.transportId,
            seatClassId: dist.seatClassId,
            seatCount: dist.seatCount,
          })),
        });
      }

      // Return updated distribution with seat class details
      const updatedDistribution = await prisma.transportSeatDistribution.findMany({
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

      return updatedDistribution;
    });

    // Calculate summary statistics
    const totalAllocated = result.reduce((sum, dist) => sum + dist.seatCount, 0);

    return {
      seatDistribution: result,
      summary: {
        totalAllocatedSeats: totalAllocated,
        totalCapacity: transport.seatCount || 0,
        remainingSeats: (transport.seatCount || 0) - totalAllocated,
      },
    };
  });
