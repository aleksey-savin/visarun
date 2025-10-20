import { visarunScheduleReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zGetAllVisarunSchedulesTrpcInput = z
  .object({
    routeId: z.string().uuid().optional(),
    isActive: z.boolean().optional(),
    search: z.string().optional(),
    validAtDate: z.date().optional(),
    dayOfWeek: z.number().int().min(0).max(6).optional(),
    includeTrips: z.boolean().optional().default(false),
  })
  .optional();

export const getAllVisarunSchedulesTrpcRoute = visarunScheduleReadProcedure
  .input(zGetAllVisarunSchedulesTrpcInput)
  .query(async ({ input, ctx }) => {
    const routeId = input?.routeId;
    const isActive = input?.isActive;
    const search = input?.search;
    const validAtDate = input?.validAtDate;
    const dayOfWeek = input?.dayOfWeek;
    const includeTrips = input?.includeTrips ?? false;

    const schedules = await ctx.prisma.visarunSchedule.findMany({
      where: {
        ...(routeId && { routeId }),
        ...(isActive !== undefined && { isActive }),
        ...(search && {
          OR: [
            {
              name: {
                contains: search,
                mode: 'insensitive',
              },
            },
            {
              description: {
                contains: search,
                mode: 'insensitive',
              },
            },
            {
              route: {
                name: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
            },
          ],
        }),
        ...(validAtDate && {
          AND: [
            { validFrom: { lte: validAtDate } },
            {
              OR: [{ validTo: null }, { validTo: { gte: validAtDate } }],
            },
          ],
        }),
        ...(dayOfWeek !== undefined && {
          daysOfWeek: {
            path: [],
            array_contains: dayOfWeek,
          },
        }),
      },
      include: {
        route: {
          include: {
            routeStops: {
              select: {
                id: true,
                stopOrder: true,
                stopType: true,
                city: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
              orderBy: {
                stopOrder: 'asc',
              },
            },
            transports: {
              select: {
                id: true,
                transport: {
                  select: {
                    id: true,
                    name: true,
                    seatCount: true,
                    transportType: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
              },
              where: {
                isActive: true,
              },
            },
          },
        },
        trips: includeTrips
          ? {
              take: 10,
              orderBy: {
                departureDateTime: 'asc',
              },
              where: {
                status: 'scheduled',
                departureDateTime: {
                  gte: new Date(),
                },
              },
            }
          : false,
      },
      orderBy: [{ route: { name: 'asc' } }, { name: 'asc' }],
    });

    // Add summary information to each schedule
    const schedulesWithSummary = schedules.map(schedule => {
      const now = new Date();
      const isCurrentlyValid =
        schedule.validFrom <= now && (!schedule.validTo || schedule.validTo >= now);
      const daysOfWeekArray = Array.isArray(schedule.daysOfWeek)
        ? (schedule.daysOfWeek as number[])
        : [];
      const totalStops = schedule.route?.routeStops?.length || 0;
      const totalTransports = schedule.route?.transports?.length || 0;
      const upcomingTrips =
        schedule.trips?.filter(trip => trip.departureDateTime > now && trip.status === 'scheduled')
          .length || 0;

      // Convert day numbers to day names
      const dayNames = [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
      ];
      const operatingDays = daysOfWeekArray.map(day => dayNames[day]).join(', ');

      // Calculate next occurrence
      let nextOccurrence = null;
      if (isCurrentlyValid && daysOfWeekArray.length > 0) {
        const today = new Date();
        const currentDay = today.getDay();

        // Find next occurrence day
        let nextDay = daysOfWeekArray.find(day => day > currentDay);
        if (!nextDay) {
          nextDay = daysOfWeekArray[0]; // Next week
        }

        const daysUntilNext =
          nextDay > currentDay ? nextDay - currentDay : 7 - currentDay + nextDay;

        nextOccurrence = new Date(today);
        nextOccurrence.setDate(today.getDate() + daysUntilNext);

        // Set the departure time
        const [hours, minutes] = schedule.departureTime.split(':').map(Number);
        nextOccurrence.setHours(hours, minutes, 0, 0);
      }

      // Calculate validity period
      const validityDays = schedule.validTo
        ? Math.ceil(
            (schedule.validTo.getTime() - schedule.validFrom.getTime()) / (1000 * 60 * 60 * 24)
          )
        : null;

      return {
        ...schedule,
        summary: {
          isCurrentlyValid,
          operatingDays,
          operatingDaysCount: daysOfWeekArray.length,
          totalStops,
          totalTransports,
          upcomingTrips,
          nextOccurrence,
          validityDays,
          isFullyConfigured: totalStops > 0 && totalTransports > 0 && daysOfWeekArray.length > 0,
          status: !schedule.isActive
            ? 'inactive'
            : !isCurrentlyValid
              ? 'expired'
              : totalStops === 0 || totalTransports === 0
                ? 'incomplete'
                : 'active',
          configurationIssues: [
            ...(totalStops === 0 ? ['No route stops configured'] : []),
            ...(totalTransports === 0 ? ['No transports assigned'] : []),
            ...(daysOfWeekArray.length === 0 ? ['No operating days specified'] : []),
          ],
        },
      };
    });

    // Group by route for better organization
    const groupedByRoute = schedulesWithSummary.reduce(
      (acc, schedule) => {
        const routeId = schedule.routeId;
        if (!acc[routeId]) {
          acc[routeId] = {
            route: schedule.route,
            schedules: [],
            summary: {
              totalSchedules: 0,
              activeSchedules: 0,
              validSchedules: 0,
              fullyConfiguredSchedules: 0,
            },
          };
        }

        acc[routeId].schedules.push(schedule);
        acc[routeId].summary.totalSchedules++;

        if (schedule.isActive) {
          acc[routeId].summary.activeSchedules++;
        }

        if (schedule.summary.isCurrentlyValid) {
          acc[routeId].summary.validSchedules++;
        }

        if (schedule.summary.isFullyConfigured) {
          acc[routeId].summary.fullyConfiguredSchedules++;
        }

        return acc;
      },
      {} as Record<
        string,
        {
          route: (typeof schedules)[0]['route'];
          schedules: typeof schedulesWithSummary;
          summary: {
            totalSchedules: number;
            activeSchedules: number;
            validSchedules: number;
            fullyConfiguredSchedules: number;
          };
        }
      >
    );

    return {
      schedules: schedulesWithSummary,
      groupedByRoute: Object.values(groupedByRoute),
    };
  });
