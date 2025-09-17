import { visarunRouteStopCreateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zCreateVisarunRouteStopTrpcInput = z.object({
  routeId: z.string().uuid('Invalid route ID'),
  cityId: z.string().uuid('Invalid city ID'),
  stopOrder: z.number().int().positive('Stop order must be a positive integer'),
  stopType: z.enum(['departure', 'arrival', 'intermediate']),
  pickupMode: z.enum(['location', 'address', 'none']),
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

    // Check if this city is already a stop on this route
    const existingStopWithCity = await ctx.prisma.visarunRouteStop.findUnique({
      where: {
        routeId_cityId: {
          routeId: input.routeId,
          cityId: input.cityId,
        },
      },
    });

    if (existingStopWithCity) {
      throw new Error('This city is already a stop on this route');
    }

    // Validate time format if provided (expecting HH:MM format)
    if (input.arrivalTime && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(input.arrivalTime)) {
      throw new Error('Arrival time must be in HH:MM format');
    }

    if (input.departureTime && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(input.departureTime)) {
      throw new Error('Departure time must be in HH:MM format');
    }

    // Create the route stop
    const routeStop = await ctx.prisma.visarunRouteStop.create({
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

    return {
      routeStop,
    };
  });
