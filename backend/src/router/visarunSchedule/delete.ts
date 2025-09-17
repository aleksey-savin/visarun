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
        route: true,
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

    // Delete the schedule
    await ctx.prisma.visarunSchedule.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Schedule deleted successfully',
    };
  });
