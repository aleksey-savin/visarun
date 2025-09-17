import { visarunScheduleUpdateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zEditVisarunScheduleTrpcInput = z.object({
  id: z.string().uuid('Invalid schedule ID'),
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().optional(),
  daysOfWeek: z
    .array(z.number().int().min(0).max(6))
    .min(1, 'At least one day must be selected')
    .optional(),
  departureTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Departure time must be in HH:MM format')
    .optional(),
  validFrom: z.date().optional(),
  validTo: z.date().optional(),
  autoGeneratePeriodMonths: z.number().int().min(1).max(24).optional(),
  isActive: z.boolean().optional(),
});

export const editVisarunScheduleTrpcRoute = visarunScheduleUpdateProcedure
  .input(zEditVisarunScheduleTrpcInput)
  .mutation(async ({ input, ctx }) => {
    const { id, ...updateData } = input;

    // Check if schedule exists
    const existingSchedule = await ctx.prisma.visarunSchedule.findUnique({
      where: { id },
      include: {
        route: true,
        trips: {
          where: {
            departureDateTime: {
              gte: new Date(),
            },
          },
          take: 1,
        },
      },
    });

    if (!existingSchedule) {
      throw new Error('Schedule not found');
    }

    // Check if schedule has upcoming trips - restrict certain changes
    const hasUpcomingTrips = existingSchedule.trips.length > 0;

    // Validate date range if being updated
    const finalValidFrom = updateData.validFrom ?? existingSchedule.validFrom;
    const finalValidTo = updateData.validTo ?? existingSchedule.validTo;

    if (finalValidTo && finalValidFrom >= finalValidTo) {
      throw new Error('Valid from date must be before valid to date');
    }

    // Don't allow changing fundamental properties if there are upcoming trips
    if (hasUpcomingTrips) {
      if (updateData.daysOfWeek) {
        throw new Error(
          'Cannot change operating days when there are upcoming trips. Cancel or reschedule trips first.'
        );
      }
      if (updateData.departureTime) {
        throw new Error(
          'Cannot change departure time when there are upcoming trips. Cancel or reschedule trips first.'
        );
      }
      if (updateData.validFrom) {
        throw new Error('Cannot change valid from date when there are upcoming trips.');
      }
    }

    // Validate days of week if being updated
    if (updateData.daysOfWeek) {
      const uniqueDays = [...new Set(updateData.daysOfWeek)];
      if (uniqueDays.length !== updateData.daysOfWeek.length) {
        throw new Error('Duplicate days of week are not allowed');
      }
    }

    // Check if name is being updated and conflicts with another schedule
    if (updateData.name && updateData.name !== existingSchedule.name) {
      const nameConflict = await ctx.prisma.visarunSchedule.findFirst({
        where: {
          routeId: existingSchedule.routeId,
          name: updateData.name,
          id: {
            not: id,
          },
        },
      });

      if (nameConflict) {
        throw new Error('Schedule with this name already exists for this route');
      }
    }

    // Check for overlapping active schedules if days or validity period changes
    if (
      (updateData.daysOfWeek || updateData.validFrom || updateData.validTo !== undefined) &&
      updateData.isActive !== false
    ) {
      const finalDaysOfWeek = updateData.daysOfWeek ?? existingSchedule.daysOfWeek;

      const overlappingSchedules = await ctx.prisma.visarunSchedule.findMany({
        where: {
          routeId: existingSchedule.routeId,
          isActive: true,
          id: {
            not: id,
          },
          AND: [
            {
              OR: [{ validTo: null }, { validTo: { gte: finalValidFrom } }],
            },
            {
              validFrom: finalValidTo ? { lte: finalValidTo } : undefined,
            },
          ],
        },
      });

      // Check for day conflicts
      for (const schedule of overlappingSchedules) {
        const scheduleDays = Array.isArray(schedule.daysOfWeek)
          ? (schedule.daysOfWeek as number[])
          : [];
        const finalDaysArray = Array.isArray(finalDaysOfWeek) ? (finalDaysOfWeek as number[]) : [];
        const hasConflict = finalDaysArray.some(day => scheduleDays.includes(day));

        if (hasConflict) {
          throw new Error(
            `Schedule conflicts with existing active schedule "${schedule.name}" on overlapping days and time period`
          );
        }
      }
    }

    // Update the schedule
    const updatedSchedule = await ctx.prisma.visarunSchedule.update({
      where: { id },
      data: {
        ...updateData,
        updatedById: ctx.user?.id,
      },
      include: {
        route: {
          include: {
            routeStops: {
              include: {
                city: true,
              },
              orderBy: {
                stopOrder: 'asc',
              },
            },
            transports: {
              include: {
                transport: {
                  include: {
                    transportType: true,
                  },
                },
              },
              where: {
                isActive: true,
              },
            },
          },
        },
        trips: {
          take: 5,
          orderBy: {
            departureDateTime: 'asc',
          },
          where: {
            departureDateTime: {
              gte: new Date(),
            },
          },
        },
      },
    });

    return {
      schedule: updatedSchedule,
    };
  });
