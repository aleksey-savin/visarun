import { orderItemCreateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';
import { PassengerStatus, VisarunServiceType } from '@prisma/client';

export const zCreateVisarunPassengerTrpcInput = z.object({
  orderItemId: z.string().uuid(),
  tripId: z.string().uuid(),
  tripTransportId: z.string().uuid().optional(),
  seatClassId: z.string().uuid().optional(),
  seatNumber: z.string().optional(),
  routeStopId: z.string().uuid().optional(),
  serviceType: z.enum(['visa', 'visa_and_transport']).default('visa'),
});

export const createVisarunPassengerTrpcRoute = orderItemCreateProcedure
  .input(zCreateVisarunPassengerTrpcInput)
  .mutation(async ({ input, ctx }) => {
    // Check if order item exists
    const orderItem = await ctx.prisma.orderItem.findUnique({
      where: { id: input.orderItemId },
      include: {
        order: true,
        client: true,
      },
    });

    if (!orderItem) {
      throw new Error('Order item not found');
    }

    // Check if trip exists
    const trip = await ctx.prisma.visarunTrip.findUnique({
      where: { id: input.tripId },
      include: {
        route: {
          include: {
            routeStops: true,
          },
        },
      },
    });

    if (!trip) {
      throw new Error('Trip not found');
    }

    // Check if tripTransport exists if provided
    if (input.tripTransportId) {
      const tripTransport = await ctx.prisma.visarunTripTransport.findUnique({
        where: { id: input.tripTransportId },
      });

      if (!tripTransport) {
        throw new Error('Trip transport not found');
      }
    }

    // Check if routeStop exists if provided
    if (input.routeStopId) {
      const routeStop = await ctx.prisma.visarunRouteStop.findUnique({
        where: { id: input.routeStopId },
      });

      if (!routeStop) {
        throw new Error('Route stop not found');
      }
    }

    // Create visarun passenger
    const visarunPassenger = await ctx.prisma.visarunPassenger.create({
      data: {
        tripId: input.tripId,
        tripTransportId: input.tripTransportId,
        clientId: orderItem.clientId,
        orderItemId: input.orderItemId,
        serviceType: input.serviceType as VisarunServiceType,
        seatClassId: input.seatClassId,
        seatNumber: input.seatNumber,
        routeStopId: input.routeStopId,
        status: PassengerStatus.confirmed,
      },
      include: {
        trip: {
          include: {
            route: {
              include: {
                routeStops: {
                  include: {
                    city: true,
                  },
                },
              },
            },
          },
        },
        tripTransport: {
          include: {
            transport: true,
          },
        },
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        pickupStop: {
          include: {
            city: true,
          },
        },
        seatClass: {
          select: {
            id: true,
            name: true,
            icon: true,
          },
        },
      },
    });

    // Update order item with visarun passenger ID
    const updatedOrderItem = await ctx.prisma.orderItem.update({
      where: { id: input.orderItemId },
      data: {
        serviceTypeId: visarunPassenger.id,
      },
    });

    return {
      orderItem: updatedOrderItem,
      visarunPassenger,
    };
  });
