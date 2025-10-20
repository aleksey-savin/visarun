import * as cron from 'node-cron';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Keep track of job status to prevent overlapping executions
let isJobRunning = false;
let cronJob: cron.ScheduledTask | null = null;

/**
 * Auto-complete orders when all related visa applications are archived
 * Runs every minute
 */
export const startAutoCompleteOrdersJob = () => {
  // Run every minute: '* * * * *'
  cronJob = cron.schedule('* * * * *', async () => {
    // Prevent overlapping job executions
    if (isJobRunning) {
      // console.log('[AutoCompleteOrders] Job already running, skipping this execution');
      return;
    }

    isJobRunning = true;

    try {
      // console.log('[AutoCompleteOrders] Starting job at', new Date().toISOString());

      // Find orders that are not completed or cancelled and have order items
      // Only check orders that have at least one visa application
      const ordersToCheck = await prisma.order.findMany({
        where: {
          status: {
            notIn: ['completed', 'cancelled'],
          },
          items: {
            some: {
              VisaApplication: {
                some: {}, // Only orders that have visa applications
              },
            },
          },
        },
        include: {
          items: {
            include: {
              VisaApplication: {
                select: {
                  id: true,
                  isArchived: true,
                },
              },
            },
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      let completedCount = 0;

      for (const order of ordersToCheck) {
        // Get all visa applications for this order
        const allVisaApplications = order.items.flatMap(item => item.VisaApplication);

        // Skip orders with no visa applications
        if (allVisaApplications.length === 0) {
          continue;
        }

        // Check if ALL visa applications are archived
        const allArchived = allVisaApplications.every(visaApp => visaApp.isArchived === true);

        if (allArchived) {
          // Update order status to completed
          await prisma.order.update({
            where: { id: order.id },
            data: {
              status: 'completed',
              updatedAt: new Date(),
            },
          });

          completedCount++;
          //console.log(
          //  `[AutoCompleteOrders] Completed order ${order.id} for user ${order.user?.firstName} ${order.user?.lastName} (${order.user?.email})`
          // );
        }
      }

      if (completedCount > 0) {
        // console.log(`[AutoCompleteOrders] Completed ${completedCount} orders`);
      } else {
        // console.log('[AutoCompleteOrders] No orders to complete');
      }
    } catch (error) {
      console.error('[AutoCompleteOrders] Error in cron job:', error);
    } finally {
      isJobRunning = false;
    }
  });

  // console.log('[AutoCompleteOrders] Cron job started - will run every minute');
};

/**
 * Stop the auto-complete orders cron job
 */
export const stopAutoCompleteOrdersJob = () => {
  if (cronJob) {
    cronJob.destroy();
    cronJob = null;
    // console.log('[AutoCompleteOrders] Cron job stopped');
  }
};

/**
 * Setup graceful shutdown handlers
 */
export const setupGracefulShutdown = () => {
  const shutdown = () => {
    // console.log('[AutoCompleteOrders] Shutting down gracefully...');
    stopAutoCompleteOrdersJob();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};

/**
 * Manually run the auto-complete logic (useful for testing)
 */
export const runAutoCompleteOrdersManually = async () => {
  try {
    // console.log('[AutoCompleteOrders] Running manually at', new Date().toISOString());

    const ordersToCheck = await prisma.order.findMany({
      where: {
        status: {
          notIn: ['completed', 'cancelled'],
        },
        items: {
          some: {
            VisaApplication: {
              some: {},
            },
          },
        },
      },
      include: {
        items: {
          include: {
            VisaApplication: {
              select: {
                id: true,
                isArchived: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    let completedCount = 0;

    for (const order of ordersToCheck) {
      const allVisaApplications = order.items.flatMap(item => item.VisaApplication);

      if (allVisaApplications.length === 0) {
        continue;
      }

      const allArchived = allVisaApplications.every(visaApp => visaApp.isArchived === true);

      if (allArchived) {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: 'completed',
            updatedAt: new Date(),
          },
        });

        completedCount++;
        //console.log(
        // `[AutoCompleteOrders] Manually completed order ${order.id} for user ${order.user?.firstName} ${order.user?.lastName}`;
        // );
      }
    }

    //  console.log(`[AutoCompleteOrders] Manual run completed. ${completedCount} orders updated.`);
    return completedCount;
  } catch (error) {
    console.error('[AutoCompleteOrders] Error in manual run:', error);
    throw error;
  }
};
