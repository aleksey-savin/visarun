/**
 * This function has been deprecated. System initialization is now handled by the Prisma seed command.
 * To initialize the system with default data, run: `pnpm prisma:seed`
 */
export async function initDefaultAdmin(): Promise<void> {
  console.log('⚠️  Warning: initDefaultAdmin is deprecated!');
  console.log('System initialization is now handled by the Prisma seed command.');
  console.log('To initialize the system with default data, run:');
  console.log('  pnpm prisma:seed');
  console.log(
    'This ensures all permissions, roles, and the default admin user are properly created.'
  );
}
