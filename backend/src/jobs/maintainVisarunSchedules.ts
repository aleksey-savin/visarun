import * as cron from 'node-cron';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Keep track of job status to prevent overlapping executions
let isJobRunning = false;
let cronJob: cron.ScheduledTask | null = null;

// Helper function to generate trips based on schedule
function generateTripsFromSchedule(
  scheduleId: string,
  routeId: string,
  daysOfWeek: number[],
  departureTime: string,
  validFrom: Date,
  validTo: Date | null,
  periodMonths: number,
  existingTrips?: Array<{ routeId: string; departureDateTime: Date }>
) {
  const trips: Array<{
    scheduleId: string;
    routeId: string;
    departureDateTime: Date;
    status: 'scheduled';
    isFromSchedule: boolean;
  }> = [];

  // Create a set of existing departure datetimes for this route for quick lookup
  const existingDepartureTimes = new Set<string>();
  if (existingTrips) {
    for (const trip of existingTrips) {
      if (trip.routeId === routeId) {
        existingDepartureTimes.add(trip.departureDateTime.toISOString());
      }
    }
  }

  // Calculate end date - either validTo or validFrom + autoGeneratePeriodMonths
  const endDate =
    validTo ||
    new Date(validFrom.getFullYear(), validFrom.getMonth() + periodMonths, validFrom.getDate());

  // Parse departure time
  const [hours, minutes] = departureTime.split(':').map(Number);

  // Start from validFrom date
  const currentDate = new Date(validFrom);
  currentDate.setHours(hours, minutes, 0, 0);

  // Generate trips for each matching day within the date range
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 6 = Saturday

    if (daysOfWeek.includes(dayOfWeek)) {
      const departureDateTime = new Date(currentDate);

      // Check if trip with same routeId and departureDateTime already exists
      if (!existingDepartureTimes.has(departureDateTime.toISOString())) {
        trips.push({
          scheduleId,
          routeId,
          departureDateTime,
          status: 'scheduled',
          isFromSchedule: true,
        });
        existingDepartureTimes.add(departureDateTime.toISOString());
      }
    }

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return trips;
}

/**
 * Maintain visa run schedules with empty validTo values
 * Ensures trips remain cohesive with autoGeneratePeriodMonths
 * Runs daily at 02:00 UTC
 */
export const startMaintainVisarunSchedulesJob = () => {
  // Run daily at 02:00 UTC: '0 2 * * *'
  cronJob = cron.schedule(
    '0 2 * * *',
    async () => {
      // Prevent overlapping job executions
      if (isJobRunning) {
        console.log('[MaintainVisarunSchedules] Job already running, skipping this execution');
        return;
      }

      isJobRunning = true;

      try {
        console.log('[MaintainVisarunSchedules] Starting job at', new Date().toISOString());

        // Find all active schedules with empty validTo values
        const schedulesToMaintain = await prisma.visarunSchedule.findMany({
          where: {
            isActive: true,
            validTo: null,
          },
          select: {
            id: true,
            routeId: true,
            daysOfWeek: true,
            departureTime: true,
            validFrom: true,
            validTo: true,
            autoGeneratePeriodMonths: true,
            name: true,
            route: {
              select: {
                name: true,
              },
            },
          },
        });

        if (schedulesToMaintain.length === 0) {
          console.log('[MaintainVisarunSchedules] No schedules with empty validTo to maintain');
          return;
        }

        console.log(
          `[MaintainVisarunSchedules] Found ${schedulesToMaintain.length} schedules to maintain`
        );

        let totalTripsGenerated = 0;

        for (const schedule of schedulesToMaintain) {
          try {
            // Calculate the furthest trip date we should have based on autoGeneratePeriodMonths
            const today = new Date();
            const targetEndDate = new Date(
              today.getFullYear(),
              today.getMonth() + schedule.autoGeneratePeriodMonths,
              today.getDate()
            );

            // Find the latest existing trip for this schedule
            const latestTrip = await prisma.visarunTrip.findFirst({
              where: {
                scheduleId: schedule.id,
                isFromSchedule: true,
              },
              orderBy: {
                departureDateTime: 'desc',
              },
              select: {
                departureDateTime: true,
              },
            });

            // If we don't have trips extending to the target end date, generate more
            if (!latestTrip || latestTrip.departureDateTime < targetEndDate) {
              console.log(
                `[MaintainVisarunSchedules] Schedule "${schedule.name}" (${schedule.route.name}) needs trip extension`
              );

              // Determine the start date for generating new trips
              const startDate = latestTrip
                ? new Date(latestTrip.departureDateTime.getTime() + 24 * 60 * 60 * 1000) // Next day after latest trip
                : Math.max(today.getTime(), schedule.validFrom.getTime()) > today.getTime()
                  ? schedule.validFrom
                  : today;

              // Fetch existing trips for this route to avoid duplicates
              const existingTripsForRoute = await prisma.visarunTrip.findMany({
                where: {
                  routeId: schedule.routeId,
                  departureDateTime: {
                    gte: startDate,
                  },
                },
                select: {
                  routeId: true,
                  departureDateTime: true,
                },
              });

              // Generate new trips
              const tripsData = generateTripsFromSchedule(
                schedule.id,
                schedule.routeId,
                Array.isArray(schedule.daysOfWeek) ? (schedule.daysOfWeek as number[]) : [],
                schedule.departureTime,
                startDate,
                null, // validTo is null for these schedules
                schedule.autoGeneratePeriodMonths,
                existingTripsForRoute
              );

              // Create new trips in bulk if any were generated
              if (tripsData.length > 0) {
                await prisma.visarunTrip.createMany({
                  data: tripsData,
                });

                totalTripsGenerated += tripsData.length;
                console.log(
                  `[MaintainVisarunSchedules] Generated ${tripsData.length} new trips for schedule "${schedule.name}" (${schedule.route.name})`
                );
              }
            }

            // Clean up old trips without passengers that are more than 1 day in the past
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const deletedTrips = await prisma.visarunTrip.deleteMany({
              where: {
                scheduleId: schedule.id,
                status: 'scheduled',
                isFromSchedule: true,
                departureDateTime: {
                  lt: oneDayAgo,
                },
                // Only delete trips without passengers
                passengers: {
                  none: {},
                },
              },
            });

            if (deletedTrips.count > 0) {
              console.log(
                `[MaintainVisarunSchedules] Cleaned up ${deletedTrips.count} old trips for schedule "${schedule.name}"`
              );
            }
          } catch (scheduleError) {
            console.error(
              `[MaintainVisarunSchedules] Error processing schedule ${schedule.id} (${schedule.name}):`,
              scheduleError
            );
          }
        }

        console.log(
          `[MaintainVisarunSchedules] Job completed. Generated ${totalTripsGenerated} total trips across ${schedulesToMaintain.length} schedules`
        );
      } catch (error) {
        console.error('[MaintainVisarunSchedules] Error in cron job:', error);
      } finally {
        isJobRunning = false;
      }
    },
    {
      timezone: 'UTC',
    }
  );

  console.log('[MaintainVisarunSchedules] Cron job started - will run daily at 02:00 UTC');
};

/**
 * Stop the maintain visa run schedules cron job
 */
export const stopMaintainVisarunSchedulesJob = () => {
  if (cronJob) {
    cronJob.destroy();
    cronJob = null;
    console.log('[MaintainVisarunSchedules] Cron job stopped');
  }
};

/**
 * Setup graceful shutdown handlers
 */
export const setupGracefulShutdown = () => {
  const shutdown = () => {
    console.log('[MaintainVisarunSchedules] Shutting down gracefully...');
    stopMaintainVisarunSchedulesJob();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};

/**
 * Manually run the maintenance logic (useful for testing)
 */
export const runMaintainVisarunSchedulesManually = async () => {
  try {
    console.log('[MaintainVisarunSchedules] Running manually at', new Date().toISOString());

    const schedulesToMaintain = await prisma.visarunSchedule.findMany({
      where: {
        isActive: true,
        validTo: null,
      },
      select: {
        id: true,
        routeId: true,
        daysOfWeek: true,
        departureTime: true,
        validFrom: true,
        validTo: true,
        autoGeneratePeriodMonths: true,
        name: true,
        route: {
          select: {
            name: true,
          },
        },
      },
    });

    if (schedulesToMaintain.length === 0) {
      console.log(
        '[MaintainVisarunSchedules] Manual run: No schedules with empty validTo to maintain'
      );
      return { schedulesProcessed: 0, tripsGenerated: 0 };
    }

    let totalTripsGenerated = 0;

    for (const schedule of schedulesToMaintain) {
      try {
        const today = new Date();
        const targetEndDate = new Date(
          today.getFullYear(),
          today.getMonth() + schedule.autoGeneratePeriodMonths,
          today.getDate()
        );

        const latestTrip = await prisma.visarunTrip.findFirst({
          where: {
            scheduleId: schedule.id,
            isFromSchedule: true,
          },
          orderBy: {
            departureDateTime: 'desc',
          },
          select: {
            departureDateTime: true,
          },
        });

        if (!latestTrip || latestTrip.departureDateTime < targetEndDate) {
          const startDate = latestTrip
            ? new Date(latestTrip.departureDateTime.getTime() + 24 * 60 * 60 * 1000)
            : Math.max(today.getTime(), schedule.validFrom.getTime()) > today.getTime()
              ? schedule.validFrom
              : today;

          const existingTripsForRoute = await prisma.visarunTrip.findMany({
            where: {
              routeId: schedule.routeId,
              departureDateTime: {
                gte: startDate,
              },
            },
            select: {
              routeId: true,
              departureDateTime: true,
            },
          });

          const tripsData = generateTripsFromSchedule(
            schedule.id,
            schedule.routeId,
            Array.isArray(schedule.daysOfWeek) ? (schedule.daysOfWeek as number[]) : [],
            schedule.departureTime,
            startDate,
            null,
            schedule.autoGeneratePeriodMonths,
            existingTripsForRoute
          );

          if (tripsData.length > 0) {
            await prisma.visarunTrip.createMany({
              data: tripsData,
            });

            totalTripsGenerated += tripsData.length;
          }
        }

        // Clean up old trips
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        await prisma.visarunTrip.deleteMany({
          where: {
            scheduleId: schedule.id,
            status: 'scheduled',
            isFromSchedule: true,
            departureDateTime: {
              lt: oneDayAgo,
            },
            passengers: {
              none: {},
            },
          },
        });
      } catch (scheduleError) {
        console.error(
          `[MaintainVisarunSchedules] Manual run error for schedule ${schedule.id}:`,
          scheduleError
        );
      }
    }

    console.log(
      `[MaintainVisarunSchedules] Manual run completed. Generated ${totalTripsGenerated} trips across ${schedulesToMaintain.length} schedules.`
    );

    return {
      schedulesProcessed: schedulesToMaintain.length,
      tripsGenerated: totalTripsGenerated,
    };
  } catch (error) {
    console.error('[MaintainVisarunSchedules] Error in manual run:', error);
    throw error;
  }
};
