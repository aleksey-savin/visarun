import { visarunTripTransportUpdateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zEditVisarunTripTransportTrpcInput = z.object({
  id: z.string().uuid(),
  driverName: z.string().nullable().optional(),
  driverPhone: z.string().nullable().optional(),
  vehicleNumber: z.string().nullable().optional(),
  status: z.enum(['added', 'rented', 'cancelled', 'completed']).optional(),
  reportUrl: z.string().nullable().optional(),
});

export const editVisarunTripTransportTrpcRoute = visarunTripTransportUpdateProcedure
  .input(zEditVisarunTripTransportTrpcInput)
  .mutation(async ({ input, ctx }) => {
    const { id, ...updateData } = input;

    const tripTransport = await ctx.prisma.visarunTripTransport.update({
      where: { id },
      data: updateData,
      include: {
        trip: {
          select: {
            id: true,
            departureDateTime: true,
            status: true,
          },
        },
        transport: {
          select: {
            id: true,
            name: true,
            seatCount: true,
            transportType: {
              select: {
                id: true,
                name: true,
                icon: true,
              },
            },
          },
        },
      },
    });

    // Check if we need to update trip status to 'in_process'
    if (updateData.status === 'rented') {
      const tripId = tripTransport.trip.id;

      // Check if there are unassigned passengers
      const unassignedPassengers = await ctx.prisma.visarunPassenger.count({
        where: {
          tripId: tripId,
          tripTransportId: null,
        },
      });

      // Check if all trip transports are rented
      const allTripTransports = await ctx.prisma.visarunTripTransport.findMany({
        where: {
          tripId: tripId,
          isActive: true,
        },
        select: {
          status: true,
        },
      });

      const allTransportsRented = allTripTransports.every(
        transport => transport.status === 'rented'
      );

      // Update trip status if conditions are met
      if (unassignedPassengers === 0 && allTransportsRented) {
        await ctx.prisma.visarunTrip.update({
          where: { id: tripId },
          data: { status: 'in_process' },
        });
      }
    }

    return tripTransport;
  });
