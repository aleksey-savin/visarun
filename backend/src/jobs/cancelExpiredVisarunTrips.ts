import * as cron from 'node-cron';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Keep track of job status to prevent overlapping executions
let isJobRunning = false;
let cronJob: cron.ScheduledTask | null = null;

/**
 * Cancel expired visa run trips
 * Finds all trips with status "scheduled", no passengers, and departure date earlier than today
 * Sets their status to "cancelled" and adds a cancel reason
 * Runs daily at 01:00 UTC
 */
export const startCancelExpiredVisarunTripsJob = () => {
  // Run daily at 01:00 UTC: '0 1 * * *'
  cronJob = cron.schedule(
    '0 1 * * *',
    async () => {
      // Prevent overlapping job executions
      if (isJobRunning) {
        console.log('[CancelExpiredVisarunTrips] Job already running, skipping this execution');
        return;
      }

      isJobRunning = true;

      try {
        console.log('[CancelExpiredVisarunTrips] Starting job at', new Date().toISOString());

        // Get the start of today (00:00:00 UTC)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Find all scheduled trips with no passengers that are earlier than today
        const expiredTrips = await prisma.visarunTrip.findMany({
          where: {
            status: 'scheduled',
            departureDateTime: {
              lt: today,
            },
            passengers: {
              none: {},
            },
          },
          select: {
            id: true,
            departureDateTime: true,
            route: {
              select: {
                name: true,
              },
            },
          },
        });

        if (expiredTrips.length === 0) {
          console.log('[CancelExpiredVisarunTrips] No expired trips found to cancel');
          return;
        }

        console.log(
          `[CancelExpiredVisarunTrips] Found ${expiredTrips.length} expired trips to cancel`
        );

        // Update all expired trips to cancelled status
        const result = await prisma.visarunTrip.updateMany({
          where: {
            id: {
              in: expiredTrips.map(trip => trip.id),
            },
          },
          data: {
            status: 'cancelled',
            cancelReason: 'Automatically cancelled - trip expired with no passengers',
            updatedAt: new Date(),
          },
        });

        console.log(
          `[CancelExpiredVisarunTrips] Successfully cancelled ${result.count} expired trips`
        );

        // Log details of cancelled trips for audit purposes
        for (const trip of expiredTrips) {
          console.log(
            `[CancelExpiredVisarunTrips] Cancelled trip: ID=${trip.id}, Route=${trip.route.name}, Departure=${trip.departureDateTime.toISOString()}`
          );
        }

        console.log('[CancelExpiredVisarunTrips] Job completed successfully');
      } catch (error) {
        console.error('[CancelExpiredVisarunTrips] Error in cron job:', error);
      } finally {
        isJobRunning = false;
      }
    },
    {
      timezone: 'UTC',
    }
  );

  console.log('[CancelExpiredVisarunTrips] Cron job started - will run daily at 01:00 UTC');
};

/**
 * Stop the cancel expired visa run trips cron job
 */
export const stopCancelExpiredVisarunTripsJob = () => {
  if (cronJob) {
    cronJob.destroy();
    cronJob = null;
    console.log('[CancelExpiredVisarunTrips] Cron job stopped');
  }
};

/**
 * Setup graceful shutdown handlers
 */
export const setupGracefulShutdown = () => {
  const shutdown = () => {
    console.log('[CancelExpiredVisarunTrips] Shutting down gracefully...');
    stopCancelExpiredVisarunTripsJob();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};

/**
 * Manually run the cancellation logic (useful for testing)
 */
export const runCancelExpiredVisarunTripsManually = async () => {
  try {
    console.log('[CancelExpiredVisarunTrips] Running manually at', new Date().toISOString());

    // Get the start of today (00:00:00 UTC)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find all scheduled trips with no passengers that are earlier than today
    const expiredTrips = await prisma.visarunTrip.findMany({
      where: {
        status: 'scheduled',
        departureDateTime: {
          lt: today,
        },
        passengers: {
          none: {},
        },
      },
      select: {
        id: true,
        departureDateTime: true,
        route: {
          select: {
            name: true,
          },
        },
      },
    });

    if (expiredTrips.length === 0) {
      console.log('[CancelExpiredVisarunTrips] Manual run: No expired trips found to cancel');
      return { tripsCancelled: 0, tripsFound: 0 };
    }

    console.log(
      `[CancelExpiredVisarunTrips] Manual run: Found ${expiredTrips.length} expired trips to cancel`
    );

    // Update all expired trips to cancelled status
    const result = await prisma.visarunTrip.updateMany({
      where: {
        id: {
          in: expiredTrips.map(trip => trip.id),
        },
      },
      data: {
        status: 'cancelled',
        cancelReason: 'Automatically cancelled - trip expired with no passengers',
        updatedAt: new Date(),
      },
    });

    console.log(
      `[CancelExpiredVisarunTrips] Manual run: Successfully cancelled ${result.count} expired trips`
    );

    // Log details of cancelled trips for audit purposes
    for (const trip of expiredTrips) {
      console.log(
        `[CancelExpiredVisarunTrips] Manual run cancelled trip: ID=${trip.id}, Route=${trip.route.name}, Departure=${trip.departureDateTime.toISOString()}`
      );
    }

    return {
      tripsFound: expiredTrips.length,
      tripsCancelled: result.count,
      cancelledTrips: expiredTrips.map(trip => ({
        id: trip.id,
        route: trip.route.name,
        departureDateTime: trip.departureDateTime,
      })),
    };
  } catch (error) {
    console.error('[CancelExpiredVisarunTrips] Error in manual run:', error);
    throw error;
  }
};
