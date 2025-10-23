import { visarunTripCreateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zCreateVisarunTripTransportTrpcInput = z.object({
  tripId: z.string().uuid(),
  transportId: z.string().uuid(),
  driverName: z.string().optional(),
  driverPhone: z.string().optional(),
  vehicleNumber: z.string().optional(),
});

export const createVisarunTripTransportTrpcRoute = visarunTripCreateProcedure
  .input(zCreateVisarunTripTransportTrpcInput)
  .mutation(async ({ input, ctx }) => {
    // Check if trip exists
    const trip = await ctx.prisma.visarunTrip.findUnique({
      where: { id: input.tripId },
      include: {
        route: {
          include: {
            transports: {
              where: {
                transportId: input.transportId,
                isActive: true,
              },
            },
          },
        },
      },
    });

    if (!trip) {
      throw new Error('Trip not found');
    }

    // Check if transport is assigned to this route
    if (trip.route.transports.length === 0) {
      throw new Error('Transport is not assigned to this route');
    }

    // Check if transport exists
    const transport = await ctx.prisma.transport.findUnique({
      where: { id: input.transportId },
    });

    if (!transport) {
      throw new Error('Transport not found');
    }

    // Create trip transport
    const tripTransport = await ctx.prisma.visarunTripTransport.create({
      data: {
        tripId: input.tripId,
        transportId: input.transportId,
        driverName: input.driverName,
        driverPhone: input.driverPhone,
        vehicleNumber: input.vehicleNumber,
      },
      include: {
        trip: true,
        transport: {
          include: {
            transportType: true,
            seatDistribution: {
              include: {
                seatClass: true,
              },
            },
          },
        },
      },
    });

    return {
      tripTransport,
    };
  });
