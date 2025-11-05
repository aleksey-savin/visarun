import { runCancelExpiredVisarunTripsManually } from '../jobs/cancelExpiredVisarunTrips.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🚀 Starting manual execution of cancel expired visarun trips job...\n');

    const result = await runCancelExpiredVisarunTripsManually();

    console.log('\n📊 Results Summary:');
    console.log(`- Trips found: ${result.tripsFound}`);
    console.log(`- Trips cancelled: ${result.tripsCancelled}`);

    if (result.cancelledTrips && result.cancelledTrips.length > 0) {
      console.log('\n📋 Cancelled trips details:');
      result.cancelledTrips.forEach((trip, index) => {
        console.log(
          `${index + 1}. Route: ${trip.route}, Departure: ${trip.departureDateTime.toISOString()}, ID: ${trip.id}`
        );
      });
    } else {
      console.log('\n✅ No expired trips found to cancel.');
    }

    console.log('\n🎉 Manual execution completed successfully!');
  } catch (error) {
    console.error('❌ Error running cancel expired trips job:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

main();
