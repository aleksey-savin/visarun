import { pickupLocationUpdateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zEditPickupLocationTrpcInput = z.object({
  id: z.string().uuid('Invalid pickup location ID'),
  name: z.string().min(1, 'Name is required').optional(),
  address: z.string().min(1, 'Address is required').optional(),
  landmark: z.string().optional(),
  coordinates: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const editPickupLocationTrpcRoute = pickupLocationUpdateProcedure
  .input(zEditPickupLocationTrpcInput)
  .mutation(async ({ input, ctx }) => {
    const { id, ...updateData } = input;

    // Check if pickup location exists
    const existingPickupLocation = await ctx.prisma.pickupLocation.findUnique({
      where: { id },
      include: {
        city: true,
      },
    });

    if (!existingPickupLocation) {
      throw new Error('Pickup location not found');
    }

    // If name is being updated, check for conflicts within the same city
    if (updateData.name && updateData.name !== existingPickupLocation.name) {
      const nameConflict = await ctx.prisma.pickupLocation.findFirst({
        where: {
          cityId: existingPickupLocation.cityId,
          name: updateData.name,
          id: {
            not: id,
          },
        },
      });

      if (nameConflict) {
        throw new Error('Pickup location with this name already exists in this city');
      }
    }

    // Validate coordinates format if provided (expecting "latitude,longitude")
    if (updateData.coordinates && !/^-?\d+\.?\d*,-?\d+\.?\d*$/.test(updateData.coordinates)) {
      throw new Error(
        'Coordinates must be in "latitude,longitude" format (e.g., "13.7563,100.5018")'
      );
    }

    // Update the pickup location
    const updatedPickupLocation = await ctx.prisma.pickupLocation.update({
      where: { id },
      data: updateData,
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
                city: true,
              },
            },
          },
        },
      },
    });

    return {
      pickupLocation: updatedPickupLocation,
    };
  });
