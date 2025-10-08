#!/usr/bin/env tsx

import { runArchiveVisaApplicationsManually } from '../jobs/archiveVisaApplications.js';
import { runAutoCompleteOrdersManually } from '../jobs/autoCompleteOrders.js';

// Available jobs
const AVAILABLE_JOBS = {
  archive: {
    name: 'Archive Visa Applications',
    description: 'Archive approved visa applications',
    run: runArchiveVisaApplicationsManually,
  },
  autocomplete: {
    name: 'Auto Complete Orders',
    description: 'Auto complete eligible orders',
    run: runAutoCompleteOrdersManually,
  },
} as const;

type JobName = keyof typeof AVAILABLE_JOBS;

async function showHelp() {
  console.log(`
🔧 Job Runner CLI

Usage: tsx src/scripts/runJob.ts <job_name>

Available jobs:
${Object.entries(AVAILABLE_JOBS)
  .map(([key, job]) => `  ${key.padEnd(12)} - ${job.description}`)
  .join('\n')}

Examples:
  tsx src/scripts/runJob.ts archive      # Run archive visa applications job
  tsx src/scripts/runJob.ts autocomplete # Run auto complete orders job
  npm run job:run archive               # Using npm script
`);
}

async function runJob(jobName: string) {
  if (!(jobName in AVAILABLE_JOBS)) {
    console.error(`❌ Unknown job: ${jobName}`);
    console.error(`Available jobs: ${Object.keys(AVAILABLE_JOBS).join(', ')}`);
    process.exit(1);
  }

  const job = AVAILABLE_JOBS[jobName as JobName];

  console.log(`🚀 Starting job: ${job.name}`);
  console.log(`📝 Description: ${job.description}`);
  console.log(`⏰ Started at: ${new Date().toISOString()}`);
  console.log('');

  try {
    const startTime = Date.now();
    const result = await job.run();
    const duration = Date.now() - startTime;

    console.log('');
    console.log(`✅ Job completed successfully in ${duration}ms`);

    if (typeof result === 'number') {
      console.log(`📊 Items processed: ${result}`);
    }

    console.log(`🏁 Finished at: ${new Date().toISOString()}`);
    process.exit(0);
  } catch (error) {
    console.log('');
    console.error('❌ Job failed:', error);
    console.error(`🏁 Failed at: ${new Date().toISOString()}`);
    process.exit(1);
  }
}

async function main() {
  const jobName = process.argv[2];

  if (!jobName || jobName === '--help' || jobName === '-h') {
    await showHelp();
    process.exit(0);
  }

  await runJob(jobName);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

main().catch(error => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});
