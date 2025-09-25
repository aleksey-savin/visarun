import { visarunScheduleDeleteProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zDeleteVisarunScheduleTrpcInput = z.object({
  id: z.string().uuid('Invalid schedule ID'),
});

export const deleteVisarunScheduleTrpcRoute = visarunScheduleDeleteProcedure
  .input(zDeleteVisarunScheduleTrpcInput)
  .mutation(async ({ input, ctx }) => {
    const { id } = input;

    // Check if schedule exists
    const existingSchedule = await ctx.prisma.visarunSchedule.findUnique({
      where: { id },
      include: {
        trips: true,
        route: {
          include: {
            routeStops: true,
          },
        },
      },
    });

    if (!existingSchedule) {
      throw new Error('Schedule not found');
    }

    // Check if schedule has any trips
    if (existingSchedule.trips.length > 0) {
      for (const trip of existingSchedule.trips) {
        if (trip.status === 'scheduled') {
          await ctx.prisma.visarunTrip.delete({
            where: { id: trip.id },
          });
        }
      }
    }

    const routeId = existingSchedule.routeId;

    // Delete the schedule first
    await ctx.prisma.visarunSchedule.delete({
      where: { id },
    });

    // Check if this route is used by other schedules
    const otherSchedules = await ctx.prisma.visarunSchedule.findMany({
      where: { routeId },
    });

    // If no other schedules use this route, delete the route and its stops
    if (otherSchedules.length === 0) {
      // Delete route stops first (they cascade delete, but being explicit)
      await ctx.prisma.visarunRouteStop.deleteMany({
        where: { routeId },
      });

      // Delete route transports
      await ctx.prisma.visarunRouteTransport.deleteMany({
        where: { routeId },
      });

      // Delete seat prices
      await ctx.prisma.visarunSeatPrice.deleteMany({
        where: { routeId },
      });

      // Delete the route
      await ctx.prisma.visarunRoute.delete({
        where: { id: routeId },
      });
    }

    return {
      success: true,
      message: 'Schedule deleted successfully',
    };
  });
