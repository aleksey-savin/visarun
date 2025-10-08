import * as cron from 'node-cron';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Keep track of job status to prevent overlapping executions
let isJobRunning = false;
let cronJob: cron.ScheduledTask | null = null;

/**
 * Archive visa applications in 'approved' status
 * Runs daily at 07:00 UTC
 */
export const startArchiveVisaApplicationsJob = () => {
  // Run daily at 07:00 UTC: '0 7 * * *'
  cronJob = cron.schedule(
    '22 5 * * *',
    async () => {
      // Prevent overlapping job executions
      if (isJobRunning) {
        console.log('[ArchiveVisaApplications] Job already running, skipping this execution');
        return;
      }

      isJobRunning = true;

      try {
        console.log('[ArchiveVisaApplications] Starting job at', new Date().toISOString());

        // Find all visa applications with status 'approved' that are not yet archived
        const visaApplicationsToArchive = await prisma.visaApplication.findMany({
          where: {
            status: 'approved',
            isArchived: false,
          },
          select: {
            id: true,
            applicationCode: true,
            status: true,
            isArchived: true,
            orderItem: {
              select: {
                order: {
                  select: {
                    id: true,
                    user: {
                      select: {
                        firstName: true,
                        lastName: true,
                        email: true,
                      },
                    },
                  },
                },
              },
            },
          },
        });

        if (visaApplicationsToArchive.length === 0) {
          console.log('[ArchiveVisaApplications] No approved visa applications to archive');
          return;
        }

        // Update all approved visa applications to archived
        const result = await prisma.visaApplication.updateMany({
          where: {
            status: 'approved',
            isArchived: false,
          },
          data: {
            isArchived: true,
            updatedAt: new Date(),
          },
        });

        console.log(
          `[ArchiveVisaApplications] Successfully archived ${result.count} visa applications`
        );

        // Log details of archived applications
        visaApplicationsToArchive.forEach(visaApp => {
          const user = visaApp.orderItem.order.user;
          console.log(
            `[ArchiveVisaApplications] Archived visa application ${visaApp.applicationCode || visaApp.id} for user ${user.firstName} ${user.lastName} (${user.email})`
          );
        });
      } catch (error) {
        console.error('[ArchiveVisaApplications] Error in cron job:', error);
      } finally {
        isJobRunning = false;
      }
    },
    {
      timezone: 'UTC',
    }
  );

  console.log('[ArchiveVisaApplications] Cron job started - will run daily at 07:00 UTC');
};

/**
 * Stop the archive visa applications cron job
 */
export const stopArchiveVisaApplicationsJob = () => {
  if (cronJob) {
    cronJob.destroy();
    cronJob = null;
    console.log('[ArchiveVisaApplications] Cron job stopped');
  }
};

/**
 * Setup graceful shutdown handlers
 */
export const setupGracefulShutdown = () => {
  const shutdown = () => {
    console.log('[ArchiveVisaApplications] Shutting down gracefully...');
    stopArchiveVisaApplicationsJob();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};

/**
 * Manually run the archive logic (useful for testing)
 */
export const runArchiveVisaApplicationsManually = async () => {
  try {
    console.log('[ArchiveVisaApplications] Running manually at', new Date().toISOString());

    const visaApplicationsToArchive = await prisma.visaApplication.findMany({
      where: {
        status: 'approved',
        isArchived: false,
      },
      select: {
        id: true,
        applicationCode: true,
        status: true,
        isArchived: true,
        orderItem: {
          select: {
            order: {
              select: {
                id: true,
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (visaApplicationsToArchive.length === 0) {
      console.log('[ArchiveVisaApplications] Manual run: No approved visa applications to archive');
      return 0;
    }

    const result = await prisma.visaApplication.updateMany({
      where: {
        status: 'approved',
        isArchived: false,
      },
      data: {
        isArchived: true,
        updatedAt: new Date(),
      },
    });

    console.log(
      `[ArchiveVisaApplications] Manual run completed. ${result.count} visa applications archived.`
    );

    // Log details of archived applications
    visaApplicationsToArchive.forEach(visaApp => {
      const user = visaApp.orderItem.order.user;
      console.log(
        `[ArchiveVisaApplications] Manually archived visa application ${visaApp.applicationCode || visaApp.id} for user ${user.firstName} ${user.lastName} (${user.email})`
      );
    });

    return result.count;
  } catch (error) {
    console.error('[ArchiveVisaApplications] Error in manual run:', error);
    throw error;
  }
};
