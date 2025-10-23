import { visarunPassengerUpdateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zUpdateVisarunPassengerTrpcInput = z.object({
  id: z.string().uuid(),
  tripTransportId: z.string().uuid().optional().nullable(),
  seatClassId: z.string().uuid().optional().nullable(),
  seatNumber: z.string().optional().nullable(),
  pickupAddress: z.string().optional().nullable(),
  pickupLocationId: z.string().uuid().optional().nullable(),
  pickupTime: z.string().optional().nullable(),
  routeStopId: z.string().uuid().optional().nullable(),
});

export const updateVisarunPassengerTrpcRoute = visarunPassengerUpdateProcedure
  .input(zUpdateVisarunPassengerTrpcInput)
  .mutation(async ({ input, ctx }) => {
    const { id, ...updateData } = input;

    // Check if passenger exists
    const existingPassenger = await ctx.prisma.visarunPassenger.findUnique({
      where: { id },
    });

    if (!existingPassenger) {
      throw new Error('Passenger not found');
    }

    // Check if tripTransport exists if provided
    if (updateData.tripTransportId) {
      const tripTransport = await ctx.prisma.visarunTripTransport.findUnique({
        where: { id: updateData.tripTransportId },
      });

      if (!tripTransport) {
        throw new Error('Trip transport not found');
      }

      // Ensure the trip transport belongs to the same trip as the passenger
      if (tripTransport.tripId !== existingPassenger.tripId) {
        throw new Error('Trip transport must belong to the same trip as the passenger');
      }
    }

    // Check if seat class exists if provided
    if (updateData.seatClassId) {
      const seatClass = await ctx.prisma.seatClass.findUnique({
        where: { id: updateData.seatClassId },
      });

      if (!seatClass) {
        throw new Error('Seat class not found');
      }
    }

    // Check if pickup location exists if provided
    if (updateData.pickupLocationId) {
      const pickupLocation = await ctx.prisma.pickupLocation.findUnique({
        where: { id: updateData.pickupLocationId },
      });

      if (!pickupLocation) {
        throw new Error('Pickup location not found');
      }
    }

    // Check if route stop exists if provided
    if (updateData.routeStopId) {
      const routeStop = await ctx.prisma.visarunRouteStop.findUnique({
        where: { id: updateData.routeStopId },
      });

      if (!routeStop) {
        throw new Error('Route stop not found');
      }
    }

    // Update the passenger
    const updatedPassenger = await ctx.prisma.visarunPassenger.update({
      where: { id },
      data: updateData,
      include: {
        client: {
          select: {
            firstName: true,
            lastName: true,
            isPrimary: true,
          },
        },
        seatClass: {
          select: {
            icon: true,
            name: true,
          },
        },
        tripTransport: {
          select: {
            id: true,
            transport: {
              select: {
                name: true,
              },
            },
          },
        },
        orderItem: {
          select: {
            orderId: true,
          },
        },
      },
    });

    return {
      passenger: updatedPassenger,
    };
  });
