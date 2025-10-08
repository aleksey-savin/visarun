#!/usr/bin/env tsx

import { runArchiveVisaApplicationsManually } from '../jobs/archiveVisaApplications.js';

async function main() {
  console.log('🚀 Starting manual archive visa applications job...');

  try {
    const archivedCount = await runArchiveVisaApplicationsManually();

    if (archivedCount > 0) {
      console.log(`✅ Successfully archived ${archivedCount} visa applications`);
    } else {
      console.log('ℹ️ No visa applications needed to be archived');
    }

    console.log('🏁 Archive job completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Archive job failed:', error);
    process.exit(1);
  }
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

main();
