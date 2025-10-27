import { visarunTripTransportDeleteProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zDeleteVisarunTripTransportTrpcInput = z.object({
  id: z.string().uuid(),
});

export const deleteVisarunTripTransportTrpcRoute = visarunTripTransportDeleteProcedure
  .input(zDeleteVisarunTripTransportTrpcInput)
  .mutation(async ({ input, ctx }) => {
    // Check if trip transport exists
    const existingTripTransport = await ctx.prisma.visarunTripTransport.findUnique({
      where: { id: input.id },
      include: {
        trip: true,
        transport: true,
      },
    });

    if (!existingTripTransport) {
      throw new Error('Trip transport not found');
    }

    // Check if there are passengers assigned to this trip transport
    const passengersCount = await ctx.prisma.visarunPassenger.count({
      where: {
        tripTransportId: input.id,
      },
    });

    if (passengersCount > 0) {
      throw new Error(
        `Cannot delete trip transport. ${passengersCount} passenger(s) are assigned to this transport.`
      );
    }

    // Delete trip transport (hard delete from database)
    await ctx.prisma.visarunTripTransport.delete({
      where: { id: input.id },
    });

    return {
      success: true,
      message: 'Trip transport deleted successfully',
    };
  });
