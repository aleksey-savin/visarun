import { visarunTripTransportReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zGetByTripIdsTrpcInput = z.object({
  tripIds: z.array(z.string().uuid()),
});

export const getByTripIdsTrpcRoute = visarunTripTransportReadProcedure
  .input(zGetByTripIdsTrpcInput)
  .query(async ({ input, ctx }) => {
    if (input.tripIds.length === 0) {
      return [];
    }

    const tripTransports = await ctx.prisma.visarunTripTransport.findMany({
      where: {
        tripId: {
          in: input.tripIds,
        },
        isActive: true,
      },
      select: {
        id: true,
        driverName: true,
        driverPhone: true,
        vehicleNumber: true,
        status: true,
        createdAt: true,
        reportUrl: true,
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
        trip: {
          select: {
            id: true,
            departureDateTime: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return tripTransports;
  });
