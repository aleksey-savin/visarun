import { visarunScheduleReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zGetVisarunScheduleTrpcInput = z.object({
  id: z.string().uuid('Invalid schedule ID'),
  includeTrips: z.boolean().optional().default(true),
  tripsLimit: z.number().int().min(1).max(100).optional().default(20),
});

export const getVisarunScheduleTrpcRoute = visarunScheduleReadProcedure
  .input(zGetVisarunScheduleTrpcInput)
  .query(async ({ input, ctx }) => {
    const schedule = await ctx.prisma.visarunSchedule.findUnique({
      where: { id: input.id },
      include: {
        route: {
          include: {
            routeStops: {
              include: {
                city: {
                  include: {
                    country: true,
                  },
                },
                pickupLocations: {
                  where: {
                    pickupLocation: {
                      isActive: true,
                    },
                  },
                  include: {
                    pickupLocation: true,
                  },
                },
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
                    seatDistribution: {
                      include: {
                        seatClass: true,
                      },
                    },
                  },
                },
              },
              where: {
                isActive: true,
              },
            },
            prices: {
              include: {
                seatClass: true,
              },
            },
          },
        },
        trips: input.includeTrips
          ? {
              take: input.tripsLimit,
              orderBy: {
                departureDateTime: 'asc',
              },
              where: {
                departureDateTime: {
                  gte: new Date(),
                },
              },
              include: {
                transports: {
                  include: {
                    transport: true,
                  },
                },
                passengers: {
                  select: {
                    id: true,
                    status: true,
                    seatNumber: true,
                  },
                },
              },
            }
          : false,
      },
    });

    if (!schedule) {
      throw new Error('Schedule not found');
    }

    // Calculate detailed summary information
    const now = new Date();
    const isCurrentlyValid =
      schedule.validFrom <= now && (!schedule.validTo || schedule.validTo >= now);
    const daysOfWeekArray = Array.isArray(schedule.daysOfWeek)
      ? (schedule.daysOfWeek as number[])
      : [];
    const totalStops = schedule.route.routeStops?.length || 0;
    const totalTransports = schedule.route.transports?.length || 0;
    const totalPriceRules = schedule.route.prices?.length || 0;
    const upcomingTrips = schedule.trips?.length || 0;

    // Convert day numbers to day names
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const operatingDays = daysOfWeekArray
      .filter((day): day is number => typeof day === 'number' && day >= 0 && day <= 6)
      .map(day => dayNames[day])
      .join(', ');

    // Calculate next several occurrences
    const nextOccurrences = [];
    if (isCurrentlyValid && daysOfWeekArray.length > 0) {
      const today = new Date();
      const currentDay = today.getDay();
      const [hours, minutes] = schedule.departureTime.split(':').map(Number);

      for (let week = 0; week < 4; week++) {
        for (const dayOfWeekRaw of daysOfWeekArray.sort()) {
          const dayOfWeek = typeof dayOfWeekRaw === 'number' ? dayOfWeekRaw : 0;
          const occurrence = new Date(today);
          const daysToAdd =
            week * 7 +
            (dayOfWeek >= currentDay && week === 0
              ? dayOfWeek - currentDay
              : 7 - currentDay + dayOfWeek);

          // Skip if it's today but departure time has passed
          if (week === 0 && dayOfWeek === currentDay) {
            const nowTime = today.getHours() * 60 + today.getMinutes();
            const departureTimeMinutes = hours * 60 + minutes;
            if (nowTime >= departureTimeMinutes) {
              continue;
            }
          }

          occurrence.setDate(today.getDate() + daysToAdd);
          occurrence.setHours(hours, minutes, 0, 0);

          // Check if within validity period
          if (!schedule.validTo || occurrence <= schedule.validTo) {
            nextOccurrences.push(occurrence);
          }
        }
      }
    }

    // Calculate validity period information
    const validityInfo = {
      isCurrentlyValid,
      validFrom: schedule.validFrom,
      validTo: schedule.validTo,
      isExpired: schedule.validTo && schedule.validTo < now,
      isNotYetActive: schedule.validFrom > now,
      remainingDays: schedule.validTo
        ? Math.max(
            0,
            Math.ceil((schedule.validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          )
        : null,
      totalValidityDays: schedule.validTo
        ? Math.ceil(
            (schedule.validTo.getTime() - schedule.validFrom.getTime()) / (1000 * 60 * 60 * 24)
          )
        : null,
    };

    // Analyze trip statistics
    let bookedPassengers = 0;
    if (input.includeTrips && schedule.trips) {
      bookedPassengers = schedule.trips.reduce((sum, trip) => {
        if ('passengers' in trip && Array.isArray(trip.passengers)) {
          return sum + trip.passengers.length;
        }
        return sum;
      }, 0);
    }

    const tripStats = {
      upcomingTrips,
      totalCapacityPerTrip:
        schedule.route.transports?.reduce((sum, rt) => sum + (rt.transport.seatCount || 0), 0) || 0,
      bookedPassengers,
      averageOccupancy: upcomingTrips > 0 ? bookedPassengers / upcomingTrips : 0,
    };

    // Validate configuration
    const configurationIssues = [];
    if (totalStops === 0) configurationIssues.push('No route stops configured');
    if (totalTransports === 0) configurationIssues.push('No transports assigned to route');
    if (totalPriceRules === 0) configurationIssues.push('No pricing rules configured');
    if (daysOfWeekArray.length === 0) configurationIssues.push('No operating days specified');
    if (!schedule.departureTime) configurationIssues.push('No departure time specified');

    // Check route stops configuration
    const routeStopIssues = [];
    const departureStops =
      schedule.route.routeStops?.filter(stop => stop.stopType === 'departure') || [];
    const arrivalStops =
      schedule.route.routeStops?.filter(stop => stop.stopType === 'arrival') || [];

    if (departureStops.length === 0) routeStopIssues.push('No departure stop defined');
    if (arrivalStops.length === 0) routeStopIssues.push('No arrival stop defined');

    const stopsWithoutPickup =
      schedule.route.routeStops?.filter(
        stop =>
          stop.pickupMode === 'location' &&
          (!stop.pickupLocations || stop.pickupLocations.length === 0)
      ) || [];

    if (stopsWithoutPickup.length > 0) {
      routeStopIssues.push(
        `${stopsWithoutPickup.length} stops require pickup locations but have none configured`
      );
    }

    const summary = {
      isCurrentlyValid,
      operatingDays,
      operatingDaysCount: daysOfWeekArray.length,
      totalStops,
      totalTransports,
      totalPriceRules,
      upcomingTrips,
      nextOccurrences: nextOccurrences.slice(0, 10), // Next 10 occurrences
      validityInfo,
      tripStats,
      isFullyConfigured: configurationIssues.length === 0 && routeStopIssues.length === 0,
      configurationIssues,
      routeStopIssues,
      status: !schedule.isActive
        ? 'inactive'
        : validityInfo.isExpired
          ? 'expired'
          : validityInfo.isNotYetActive
            ? 'scheduled'
            : configurationIssues.length > 0
              ? 'incomplete'
              : 'active',
      autoGeneration: {
        periodMonths: schedule.autoGeneratePeriodMonths,
        nextGenerationDate: schedule.validTo
          ? new Date(schedule.validTo.getTime() - 30 * 24 * 60 * 60 * 1000) // 30 days before expiry
          : null,
      },
    };

    return {
      schedule: {
        ...schedule,
        summary,
      },
    };
  });
