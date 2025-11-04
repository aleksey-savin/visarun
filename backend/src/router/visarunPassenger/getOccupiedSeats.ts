import { visarunPassengerReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zGetOccupiedSeatsTrpcInput = z.object({
  tripTransportId: z.string().uuid(),
});

export const zGetOccupiedSeatsByTripTransportTrpcInput = z.object({
  tripId: z.string().uuid(),
  transportId: z.string().uuid(),
});

export const getOccupiedSeatsTrpcRoute = visarunPassengerReadProcedure
  .input(zGetOccupiedSeatsTrpcInput)
  .query(async ({ input, ctx }) => {
    const occupiedSeats = await ctx.prisma.visarunPassenger.findMany({
      where: {
        tripTransportId: input.tripTransportId,
        status: {
          in: ['confirmed', 'checked_in'],
        },
        seatNumber: {
          not: null,
        },
      },
      select: {
        id: true,
        seatNumber: true,
        seatClassId: true,
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        seatClass: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return occupiedSeats;
  });

export const getOccupiedSeatsByTripTransportTrpcRoute = visarunPassengerReadProcedure
  .input(zGetOccupiedSeatsByTripTransportTrpcInput)
  .query(async ({ input, ctx }) => {
    const occupiedSeats = await ctx.prisma.visarunPassenger.findMany({
      where: {
        tripId: input.tripId,
        tripTransportId: input.transportId,
        status: {
          in: ['confirmed', 'checked_in'],
        },
        seatNumber: {
          not: null,
        },
      },
      select: {
        id: true,
        seatNumber: true,
        seatClassId: true,
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        seatClass: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return occupiedSeats;
  });
