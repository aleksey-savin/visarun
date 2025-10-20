import { visarunRouteStopUpdateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zEditVisarunRouteStopTrpcInput = z.object({
  id: z.string().uuid('Invalid route stop ID'),
  stopOrder: z.number().int().positive('Stop order must be a positive integer').optional(),
  stopType: z.enum(['departure', 'intermediate', 'arrival']).optional(),
  pickupMode: z.enum(['location', 'address']).optional(),
  pickupLocationId: z.string().uuid().optional(),
  arrivalTime: z.string().optional(),
  departureTime: z.string().optional(),
  arrivalNextDay: z.boolean().optional(),
  waitingDuration: z.number().int().min(0, 'Waiting duration must be non-negative').optional(),
});

export const editVisarunRouteStopTrpcRoute = visarunRouteStopUpdateProcedure
  .input(zEditVisarunRouteStopTrpcInput)
  .mutation(async ({ input, ctx }) => {
    const { id, pickupLocationId, ...updateData } = input;

    // Check if route stop exists
    const existingRouteStop = await ctx.prisma.visarunRouteStop.findUnique({
      where: { id },
      include: {
        route: true,
        city: true,
      },
    });

    if (!existingRouteStop) {
      throw new Error('Route stop not found');
    }

    // Validate pickup location if provided
    if (pickupLocationId) {
      const pickupLocation = await ctx.prisma.pickupLocation.findUnique({
        where: {
          id: pickupLocationId,
        },
      });

      if (
        !pickupLocation ||
        pickupLocation.cityId !== existingRouteStop.cityId ||
        !pickupLocation.isActive
      ) {
        throw new Error('Pickup location not found or not in the same city');
      }
    }

    // If stop order is being updated, check for conflicts
    if (updateData.stopOrder && updateData.stopOrder !== existingRouteStop.stopOrder) {
      const conflictingStop = await ctx.prisma.visarunRouteStop.findUnique({
        where: {
          routeId_stopOrder: {
            routeId: existingRouteStop.routeId,
            stopOrder: updateData.stopOrder,
          },
        },
      });

      if (conflictingStop && conflictingStop.id !== id) {
        throw new Error(`Stop order ${updateData.stopOrder} is already taken for this route`);
      }
    }

    // Validate time format if provided (expecting HH:MM format)
    if (
      updateData.arrivalTime &&
      !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(updateData.arrivalTime)
    ) {
      throw new Error('Arrival time must be in HH:MM format');
    }

    if (
      updateData.departureTime &&
      !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(updateData.departureTime)
    ) {
      throw new Error('Departure time must be in HH:MM format');
    }

    // Get the final values for validation
    const finalArrivalTime = updateData.arrivalTime ?? existingRouteStop.arrivalTime;
    const finalDepartureTime = updateData.departureTime ?? existingRouteStop.departureTime;
    const finalArrivalNextDay = updateData.arrivalNextDay ?? existingRouteStop.arrivalNextDay;

    // Validate that departure time is before arrival time (considering next day arrival)
    if (
      finalArrivalTime &&
      finalDepartureTime &&
      finalDepartureTime > finalArrivalTime &&
      !finalArrivalNextDay
    ) {
      throw new Error('Departure time cannot be after arrival time on the same day');
    }

    // Use transaction to update route stop and pickup location associations
    const result = await ctx.prisma.$transaction(async tx => {
      // Update the route stop
      await tx.visarunRouteStop.update({
        where: { id },
        data: updateData,
      });

      // Handle pickup location association if provided
      if (pickupLocationId !== undefined) {
        // Delete existing associations
        await tx.visarunStopPickupLocation.deleteMany({
          where: { routeStopId: id },
        });

        // Create new association
        if (pickupLocationId) {
          await tx.visarunStopPickupLocation.create({
            data: {
              routeStopId: id,
              pickupLocationId: pickupLocationId,
            },
          });
        }
      }

      // Return the updated route stop with all related data
      return await tx.visarunRouteStop.findUnique({
        where: { id },
        include: {
          route: true,
          city: {
            include: {
              country: true,
            },
          },
          pickupLocations: {
            include: {
              pickupLocation: true,
            },
          },
        },
      });
    });

    return {
      routeStop: result,
    };
  });
