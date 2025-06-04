import { PrismaClient } from '@prisma/client';
import { hashPassword } from './getPasswordHash.js';

const DEFAULT_ADMIN_EMAIL = 'admin@admin.com';
const DEFAULT_ADMIN_PASSWORD = 'admin';
const DEFAULT_ADMIN_FIRST_NAME = 'Admin';
const DEFAULT_ADMIN_LAST_NAME = 'User';

/**
 * Initialize a default admin user if no users exist in the database.
 * This should be run when the application starts up.
 */
export async function initDefaultAdmin(): Promise<void> {
  const prisma = new PrismaClient();

  try {
    // Check if any users exist
    const userCount = await prisma.user.count();

    if (userCount === 0) {
      console.log('No users found. Creating default admin user...');

      // Hash the default password
      const hashedPassword = await hashPassword(DEFAULT_ADMIN_PASSWORD);

      // Create the default admin user
      await prisma.user.create({
        data: {
          email: DEFAULT_ADMIN_EMAIL,
          firstName: DEFAULT_ADMIN_FIRST_NAME,
          lastName: DEFAULT_ADMIN_LAST_NAME,
          password: hashedPassword,
          role: 'admin',
        },
      });

      console.log(
        `Default admin user created with email: ${DEFAULT_ADMIN_EMAIL} and password: ${DEFAULT_ADMIN_PASSWORD}`
      );
      console.log('IMPORTANT: Log in and change the default password immediately!');
    }
  } catch (error) {
    console.error('Error initializing default admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}
