import { visarunRouteDeleteProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zDeleteVisarunRouteTrpcInput = z.object({
  id: z.string().uuid('Invalid route ID'),
});

export const deleteVisarunRouteTrpcRoute = visarunRouteDeleteProcedure
  .input(zDeleteVisarunRouteTrpcInput)
  .mutation(async ({ input, ctx }) => {
    const { id } = input;

    // Check if route exists
    const existingRoute = await ctx.prisma.visarunRoute.findUnique({
      where: { id },
      include: {
        VisarunSchedule: true,
        VisarunTrip: true,
      },
    });

    if (!existingRoute) {
      throw new Error('Route not found');
    }

    // Check if route has active schedules
    const activeSchedules = existingRoute.VisarunSchedule.filter(schedule => schedule.isActive);

    if (activeSchedules.length > 0) {
      throw new Error(
        'Cannot delete route with active schedules. Please deactivate all schedules first.'
      );
    }

    // Check if route has any trips
    if (existingRoute.VisarunTrip.length > 0) {
      throw new Error(
        'Cannot delete route with existing trips. This route has historical data that must be preserved.'
      );
    }

    // Delete the route (cascade will handle related records)
    await ctx.prisma.visarunRoute.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Route deleted successfully',
    };
  });
