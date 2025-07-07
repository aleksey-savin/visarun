import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupDuplicates() {
  console.log('Starting cleanup of duplicate records...');

  // Cleanup duplicate citizenships
  console.log('Cleaning up duplicate citizenships...');

  const duplicateCitizenships = await prisma.$queryRaw<
    { name: string; count: bigint; ids: string[] }[]
  >`
    SELECT
      name,
      COUNT(*) as count,
      ARRAY_AGG(id ORDER BY "favourite" DESC, id) as ids
    FROM "Citizenship"
    GROUP BY name
    HAVING COUNT(*) > 1
  `;

  let citizenshipsDeleted = 0;
  for (const duplicate of duplicateCitizenships) {
    const [keepId, ...deleteIds] = duplicate.ids;
    console.log(
      `Found ${duplicate.count} duplicates for citizenship "${duplicate.name}". Keeping ${keepId}, deleting ${deleteIds.length} duplicates.`
    );

    // Delete duplicates, keeping the first one (which has favourite=true if any)
    for (const deleteId of deleteIds) {
      await prisma.citizenship.delete({
        where: { id: deleteId },
      });
      citizenshipsDeleted++;
    }
  }

  console.log(`Deleted ${citizenshipsDeleted} duplicate citizenships`);

  // Cleanup duplicate countries
  console.log('Cleaning up duplicate countries...');

  const duplicateCountries = await prisma.$queryRaw<
    { name: string; count: bigint; ids: string[] }[]
  >`
    SELECT
      name,
      COUNT(*) as count,
      ARRAY_AGG(id ORDER BY id) as ids
    FROM "Country"
    GROUP BY name
    HAVING COUNT(*) > 1
  `;

  let countriesDeleted = 0;
  for (const duplicate of duplicateCountries) {
    const [keepId, ...deleteIds] = duplicate.ids;
    console.log(
      `Found ${duplicate.count} duplicates for country "${duplicate.name}". Keeping ${keepId}, deleting ${deleteIds.length} duplicates.`
    );

    // Delete duplicates, keeping the first one
    for (const deleteId of deleteIds) {
      await prisma.country.delete({
        where: { id: deleteId },
      });
      countriesDeleted++;
    }
  }

  console.log(`Deleted ${countriesDeleted} duplicate countries`);

  // Cleanup duplicate contact methods
  console.log('Cleaning up duplicate contact methods...');

  const duplicateContactMethods = await prisma.$queryRaw<
    { name: string; count: bigint; ids: string[] }[]
  >`
    SELECT
      name,
      COUNT(*) as count,
      ARRAY_AGG(id ORDER BY id) as ids
    FROM "ContactMethod"
    GROUP BY name
    HAVING COUNT(*) > 1
  `;

  let contactMethodsDeleted = 0;
  for (const duplicate of duplicateContactMethods) {
    const [keepId, ...deleteIds] = duplicate.ids;
    console.log(
      `Found ${duplicate.count} duplicates for contact method "${duplicate.name}". Keeping ${keepId}, deleting ${deleteIds.length} duplicates.`
    );

    // Delete duplicates, keeping the first one
    for (const deleteId of deleteIds) {
      await prisma.contactMethod.delete({
        where: { id: deleteId },
      });
      contactMethodsDeleted++;
    }
  }

  console.log(`Deleted ${contactMethodsDeleted} duplicate contact methods`);

  console.log('Cleanup completed successfully!');
  console.log(
    `Total deleted: ${citizenshipsDeleted} citizenships, ${countriesDeleted} countries, ${contactMethodsDeleted} contact methods`
  );
}

cleanupDuplicates()
  .catch(e => {
    console.error('Error during cleanup:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
