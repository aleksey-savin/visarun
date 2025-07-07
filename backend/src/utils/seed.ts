import { PrismaClient } from '@prisma/client';
import { hashPassword } from './getPasswordHash.js';
import { citizenships } from './citizenships.js';

const prisma = new PrismaClient();

const DEFAULT_ADMIN_EMAIL = 'admin@admin.com';
const DEFAULT_ADMIN_PASSWORD = 'admin';
const DEFAULT_ADMIN_FIRST_NAME = 'Admin';
const DEFAULT_ADMIN_LAST_NAME = 'User';

async function main() {
  console.log('Starting system initialization...');

  // 1. Create permissions
  console.log('Creating system permissions...');
  const permissions = [
    // Global
    { code: 'global.fullAccess', description: 'Full admin access', category: 'global' },
    // User management
    { code: 'users.create', description: 'Users creation', category: 'users' },
    { code: 'users.read', description: 'Users view', category: 'users' },
    { code: 'users.update', description: 'Users editing', category: 'users' },
    { code: 'users.delete', description: 'Users deletion', category: 'users' },
    // Role management
    { code: 'roles.create', description: 'Roles creation', category: 'roles' },
    { code: 'roles.read', description: 'Roles view', category: 'roles' },
    { code: 'roles.update', description: 'Roles editing', category: 'roles' },
    { code: 'roles.delete', description: 'Roles deletion', category: 'roles' },
    { code: 'roles.assign', description: 'Assign roles to users', category: 'roles' },
    // Exchange rates
    {
      code: 'exchangeRates.create',
      description: 'Create exchange rates',
      category: 'exchangeRates',
    },
    {
      code: 'exchangeRates.broadcast',
      description: 'Broadcast rates to Telegram',
      category: 'exchangeRates',
    },

    // Telegram management
    { code: 'telegram.channels.read', description: 'View Telegram channels', category: 'telegram' },
    {
      code: 'telegram.channels.manage',
      description: 'Manage Telegram channels',
      category: 'telegram',
    },
    {
      code: 'telegram.broadcast',
      description: 'Broadcast messages to Telegram',
      category: 'telegram',
    },

    {
      code: 'messages.manage',
      description: 'Can manage message templates',
      category: 'messages',
    },

    // Countries management
    { code: 'countries.create', description: 'Create countries', category: 'countries' },
    { code: 'countries.read', description: 'View countries', category: 'countries' },
    { code: 'countries.update', description: 'Edit countries', category: 'countries' },
    { code: 'countries.delete', description: 'Delete countries', category: 'countries' },

    // Citizenships management
    { code: 'citizenships.create', description: 'Create citizenships', category: 'citizenships' },
    { code: 'citizenships.read', description: 'View citizenships', category: 'citizenships' },
    { code: 'citizenships.update', description: 'Edit citizenships', category: 'citizenships' },
    { code: 'citizenships.delete', description: 'Delete citizenships', category: 'citizenships' },

    // Visa citizenship surcharges management
    {
      code: 'visaCitizenshipSurcharge.create',
      description: 'Create citizenship surcharges',
      category: 'visaCitizenshipSurcharge',
    },
    {
      code: 'visaCitizenshipSurcharge.read',
      description: 'View citizenship surcharges',
      category: 'visaCitizenshipSurcharge',
    },
    {
      code: 'visaCitizenshipSurcharge.update',
      description: 'Edit citizenship surcharges',
      category: 'visaCitizenshipSurcharge',
    },
    {
      code: 'visaCitizenshipSurcharge.delete',
      description: 'Delete citizenship surcharges',
      category: 'visaCitizenshipSurcharge',
    },

    // Cities management
    { code: 'cities.create', description: 'Create cities', category: 'cities' },
    { code: 'cities.read', description: 'View cities', category: 'cities' },
    { code: 'cities.update', description: 'Edit cities', category: 'cities' },
    { code: 'cities.delete', description: 'Delete cities', category: 'cities' },
  ];

  // Create permissions with duplicate checking
  let permissionsCreated = 0;
  let permissionsExisted = 0;

  for (const permission of permissions) {
    const existing = await prisma.permission.findFirst({
      where: { code: permission.code },
    });

    if (!existing) {
      await prisma.permission.create({
        data: permission,
      });
      permissionsCreated++;
    } else {
      permissionsExisted++;
    }
  }

  console.log(
    `Processed ${permissions.length} permissions: ${permissionsCreated} created, ${permissionsExisted} already existed`
  );

  const fullAccessPermission = await prisma.permission.findUnique({
    where: { code: 'global.fullAccess' },
  });

  if (!fullAccessPermission) {
    throw new Error(
      'global.fullAccess permission not found. Permission seeding might have failed.'
    );
  }

  console.log('Creating system roles...');

  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      name: 'admin',
      description: 'System administrator, can do everything',
      isSystem: true,
      isActive: true,
    },
  });

  const clientRole = await prisma.role.upsert({
    where: { name: 'client' },
    update: {},
    create: {
      name: 'client',
      description: 'Client role, has no any permissions',
      isSystem: true,
      isActive: true,
    },
  });

  console.log('System roles created.');

  console.log('Setting up role permissions...');

  await prisma.rolePermission.deleteMany({
    where: { roleId: adminRole.id },
  });

  await prisma.rolePermission.upsert({
    where: {
      roleId_permissionId: {
        roleId: adminRole.id,
        permissionId: fullAccessPermission.id,
      },
    },
    update: {},
    create: {
      roleId: adminRole.id,
      permissionId: fullAccessPermission.id,
    },
  });

  await prisma.rolePermission.deleteMany({
    where: { roleId: clientRole.id },
  });

  console.log('Role permissions configured.');

  // Create basic contact methods
  console.log('Creating basic contact methods...');
  const contactMethods = [
    { name: 'phone', description: 'Phone number' },
    { name: 'telegram', description: 'Telegram messenger contact' },
    { name: 'whatsapp', description: 'WhatsApp messenger contact' },
    { name: 'wechat', description: 'WeChat messenger contact' },
  ];

  // Create contact methods with duplicate checking
  let contactMethodsCreated = 0;
  let contactMethodsExisted = 0;

  for (const contactMethod of contactMethods) {
    const existing = await prisma.contactMethod.findFirst({
      where: { name: contactMethod.name },
    });

    if (!existing) {
      await prisma.contactMethod.create({
        data: contactMethod,
      });
      contactMethodsCreated++;
    } else {
      contactMethodsExisted++;
    }
  }

  console.log(
    `Processed ${contactMethods.length} contact methods: ${contactMethodsCreated} created, ${contactMethodsExisted} already existed`
  );

  // Create citizenships with duplicate checking
  console.log('Creating citizenships...');

  let citizenshipsCreated = 0;
  let citizenshipsExisted = 0;

  for (const citizenship of citizenships) {
    const existing = await prisma.citizenship.findFirst({
      where: { name: citizenship.name },
    });

    if (!existing) {
      await prisma.citizenship.create({
        data: citizenship,
      });
      citizenshipsCreated++;
    } else {
      citizenshipsExisted++;
    }
  }

  console.log(
    `Processed ${citizenships.length} citizenships: ${citizenshipsCreated} created, ${citizenshipsExisted} already existed`
  );

  const userCount = await prisma.user.count();

  if (userCount === 0) {
    console.log('No users found. Creating default admin user...');

    const hashedPassword = await hashPassword(DEFAULT_ADMIN_PASSWORD);

    const adminUser = await prisma.user.create({
      data: {
        email: DEFAULT_ADMIN_EMAIL,
        firstName: DEFAULT_ADMIN_FIRST_NAME,
        lastName: DEFAULT_ADMIN_LAST_NAME,
        password: hashedPassword,
        mustChangePassword: true,
      },
    });

    await prisma.userRoleAssignment.create({
      data: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    });

    console.log(
      `Default admin user created with email: ${DEFAULT_ADMIN_EMAIL} and password: ${DEFAULT_ADMIN_PASSWORD}`
    );
    console.log('IMPORTANT: Log in and change the default password immediately!');
  } else {
    console.log('Users already exist, skipping default admin creation.');
  }

  console.log('System initialization completed successfully!');
}

main()
  .catch(e => {
    console.error('Error during system initialization:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
