import { pickupLocationCreateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zCreatePickupLocationTrpcInput = z.object({
  cityId: z.string().uuid('Invalid city ID'),
  name: z.string().min(1, 'Name is required'),
  address: z.string().min(1, 'Address is required'),
  landmark: z.string().optional(),
  coordinates: z.string().optional(),
  isActive: z.boolean().optional().default(true),
});

export const createPickupLocationTrpcRoute = pickupLocationCreateProcedure
  .input(zCreatePickupLocationTrpcInput)
  .mutation(async ({ input, ctx }) => {
    // Check if city exists
    const city = await ctx.prisma.city.findUnique({
      where: { id: input.cityId },
    });

    if (!city) {
      throw new Error('City not found');
    }

    // Check if pickup location with the same name already exists in this city
    const existingPickupLocation = await ctx.prisma.pickupLocation.findFirst({
      where: {
        cityId: input.cityId,
        name: input.name,
      },
    });

    if (existingPickupLocation) {
      throw new Error('Pickup location with this name already exists in this city');
    }

    // Validate coordinates format if provided (expecting "latitude,longitude")
    if (input.coordinates && !/^-?\d+\.?\d*,-?\d+\.?\d*$/.test(input.coordinates)) {
      throw new Error(
        'Coordinates must be in "latitude,longitude" format (e.g., "13.7563,100.5018")'
      );
    }

    // Create the pickup location
    const pickupLocation = await ctx.prisma.pickupLocation.create({
      data: {
        cityId: input.cityId,
        name: input.name,
        address: input.address,
        landmark: input.landmark,
        coordinates: input.coordinates,
        isActive: input.isActive,
      },
      include: {
        city: {
          include: {
            country: true,
          },
        },
        routeStops: {
          include: {
            routeStop: {
              include: {
                route: true,
              },
            },
          },
        },
      },
    });

    return {
      pickupLocation,
    };
  });
