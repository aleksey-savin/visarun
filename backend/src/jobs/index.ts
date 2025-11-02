import {
  startAutoCompleteOrdersJob,
  stopAutoCompleteOrdersJob,
  setupGracefulShutdown as setupAutoCompleteGracefulShutdown,
  runAutoCompleteOrdersManually,
} from './autoCompleteOrders.js';

import {
  startArchiveVisaApplicationsJob,
  stopArchiveVisaApplicationsJob,
  setupGracefulShutdown as setupArchiveGracefulShutdown,
  runArchiveVisaApplicationsManually,
} from './archiveVisaApplications.js';

import {
  startMaintainVisarunSchedulesJob,
  stopMaintainVisarunSchedulesJob,
  setupGracefulShutdown as setupMaintainVisarunSchedulesGracefulShutdown,
  runMaintainVisarunSchedulesManually,
} from './maintainVisarunSchedules.js';

/**
 * Start all cron jobs
 */
export const startAllJobs = () => {
  startAutoCompleteOrdersJob();
  startArchiveVisaApplicationsJob();
  startMaintainVisarunSchedulesJob();
  console.log('✅ All cron jobs started');
};

/**
 * Stop all cron jobs
 */
export const stopAllJobs = () => {
  stopAutoCompleteOrdersJob();
  stopArchiveVisaApplicationsJob();
  stopMaintainVisarunSchedulesJob();
  console.log('🛑 All cron jobs stopped');
};

/**
 * Setup graceful shutdown for all jobs
 */
export const setupAllGracefulShutdowns = () => {
  setupAutoCompleteGracefulShutdown();
  setupArchiveGracefulShutdown();
  setupMaintainVisarunSchedulesGracefulShutdown();
  console.log('🔄 Graceful shutdown handlers set up for all jobs');
};

// Re-export individual functions for direct access
export {
  startAutoCompleteOrdersJob,
  stopAutoCompleteOrdersJob,
  setupAutoCompleteGracefulShutdown,
  runAutoCompleteOrdersManually,
  startArchiveVisaApplicationsJob,
  stopArchiveVisaApplicationsJob,
  setupArchiveGracefulShutdown,
  runArchiveVisaApplicationsManually,
  startMaintainVisarunSchedulesJob,
  stopMaintainVisarunSchedulesJob,
  setupMaintainVisarunSchedulesGracefulShutdown,
  runMaintainVisarunSchedulesManually,
};
