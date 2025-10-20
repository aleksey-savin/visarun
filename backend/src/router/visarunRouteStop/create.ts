import { visarunRouteStopCreateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zCreateVisarunRouteStopTrpcInput = z.object({
  routeId: z.string().uuid('Invalid route ID'),
  cityId: z.string().uuid('Invalid city ID'),
  stopOrder: z.number().int().positive('Stop order must be a positive integer'),
  stopType: z.enum(['departure', 'arrival', 'intermediate']),
  pickupMode: z.enum(['location', 'address']),
  pickupLocationId: z.string().uuid().optional(),
  arrivalTime: z.string().optional(),
  departureTime: z.string().optional(),
  arrivalNextDay: z.boolean().optional().default(false),
  waitingDuration: z.number().int().min(0, 'Waiting duration must be non-negative').optional(),
});

export const createVisarunRouteStopTrpcRoute = visarunRouteStopCreateProcedure
  .input(zCreateVisarunRouteStopTrpcInput)
  .mutation(async ({ input, ctx }) => {
    // Check if route exists
    const route = await ctx.prisma.visarunRoute.findUnique({
      where: { id: input.routeId },
    });

    if (!route) {
      throw new Error('Route not found');
    }

    // Check if city exists
    const city = await ctx.prisma.city.findUnique({
      where: { id: input.cityId },
    });

    if (!city) {
      throw new Error('City not found');
    }

    // Check if stop order already exists for this route
    const existingStopWithOrder = await ctx.prisma.visarunRouteStop.findUnique({
      where: {
        routeId_stopOrder: {
          routeId: input.routeId,
          stopOrder: input.stopOrder,
        },
      },
    });

    if (existingStopWithOrder) {
      throw new Error(`Stop order ${input.stopOrder} is already taken for this route`);
    }

    // Validate time format if provided (expecting HH:MM format)
    if (input.arrivalTime && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(input.arrivalTime)) {
      throw new Error('Arrival time must be in HH:MM format');
    }

    if (input.departureTime && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(input.departureTime)) {
      throw new Error('Departure time must be in HH:MM format');
    }

    // Validate pickup location if provided
    if (input.pickupLocationId) {
      const pickupLocation = await ctx.prisma.pickupLocation.findUnique({
        where: {
          id: input.pickupLocationId,
        },
      });

      if (!pickupLocation || pickupLocation.cityId !== input.cityId || !pickupLocation.isActive) {
        throw new Error('Pickup location not found or not in the same city');
      }
    }

    // Use transaction to create route stop and pickup location associations
    const result = await ctx.prisma.$transaction(async tx => {
      // Create the route stop
      const routeStop = await tx.visarunRouteStop.create({
        data: {
          routeId: input.routeId,
          cityId: input.cityId,
          stopOrder: input.stopOrder,
          stopType: input.stopType,
          pickupMode: input.pickupMode,
          arrivalTime: input.arrivalTime,
          departureTime: input.departureTime,
          arrivalNextDay: input.arrivalNextDay,
          waitingDuration: input.waitingDuration,
        },
      });

      // Create pickup location association if provided
      if (input.pickupLocationId) {
        await tx.visarunStopPickupLocation.create({
          data: {
            routeStopId: routeStop.id,
            pickupLocationId: input.pickupLocationId,
          },
        });
      }

      // Return the route stop with all related data
      return await tx.visarunRouteStop.findUnique({
        where: { id: routeStop.id },
        include: {
          route: true,
          city: true,
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
