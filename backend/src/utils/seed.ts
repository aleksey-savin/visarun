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

    // Visa types management
    { code: 'visaTypes.create', description: 'Create visa types', category: 'visaTypes' },
    { code: 'visaTypes.read', description: 'View visa types', category: 'visaTypes' },
    { code: 'visaTypes.update', description: 'Edit visa types', category: 'visaTypes' },
    { code: 'visaTypes.delete', description: 'Delete visa types', category: 'visaTypes' },

    // Visa citizenship surcharges management
    {
      code: 'visaCitizenshipSurcharges.create',
      description: 'Create citizenship surcharges',
      category: 'visaCitizenshipSurcharges',
    },
    {
      code: 'visaCitizenshipSurcharges.read',
      description: 'View citizenship surcharges',
      category: 'visaCitizenshipSurcharges',
    },
    {
      code: 'visaCitizenshipSurcharges.update',
      description: 'Edit citizenship surcharges',
      category: 'visaCitizenshipSurcharges',
    },
    {
      code: 'visaCitizenshipSurcharges.delete',
      description: 'Delete citizenship surcharges',
      category: 'visaCitizenshipSurcharges',
    },

    // Cities management
    { code: 'cities.create', description: 'Create cities', category: 'cities' },
    { code: 'cities.read', description: 'View cities', category: 'cities' },
    { code: 'cities.update', description: 'Edit cities', category: 'cities' },
    { code: 'cities.delete', description: 'Delete cities', category: 'cities' },

    // Requirements management
    { code: 'requirements.create', description: 'Create requirements', category: 'requirements' },
    { code: 'requirements.read', description: 'View requirements', category: 'requirements' },
    { code: 'requirements.update', description: 'Edit requirements', category: 'requirements' },
    { code: 'requirements.delete', description: 'Delete requirements', category: 'requirements' },

    // Requirement documents management
    {
      code: 'requirementDocuments.create',
      description: 'Create requirement documents',
      category: 'requirementDocuments',
    },
    {
      code: 'requirementDocuments.read',
      description: 'View requirement documents',
      category: 'requirementDocuments',
    },
    {
      code: 'requirementDocuments.update',
      description: 'Edit requirement documents',
      category: 'requirementDocuments',
    },
    {
      code: 'requirementDocuments.delete',
      description: 'Delete requirement documents',
      category: 'requirementDocuments',
    },

    // Audit management
    {
      code: 'audit.manage',
      description: 'Manage audit logs and recover deleted entities',
      category: 'audit',
    },

    // Orders management
    { code: 'orders.create', description: 'Create orders', category: 'orders' },
    { code: 'orders.read', description: 'View orders', category: 'orders' },
    { code: 'orders.update', description: 'Edit orders', category: 'orders' },
    { code: 'orders.delete', description: 'Delete orders', category: 'orders' },

    // Order items management
    { code: 'orderItems.create', description: 'Create order items', category: 'orderItems' },
    { code: 'orderItems.read', description: 'View order items', category: 'orderItems' },
    { code: 'orderItems.update', description: 'Edit order items', category: 'orderItems' },
    { code: 'orderItems.delete', description: 'Delete order items', category: 'orderItems' },

    // Client discount rules management
    {
      code: 'clientDiscountRules.create',
      description: 'Create client discount rules',
      category: 'clientDiscountRules',
    },
    {
      code: 'clientDiscountRules.read',
      description: 'View client discount rules',
      category: 'clientDiscountRules',
    },
    {
      code: 'clientDiscountRules.update',
      description: 'Edit client discount rules',
      category: 'clientDiscountRules',
    },
    {
      code: 'clientDiscountRules.delete',
      description: 'Delete client discount rules',
      category: 'clientDiscountRules',
    },

    // Client discount assignments management
    {
      code: 'clientDiscountAssignments.create',
      description: 'Create client discount assignments',
      category: 'clientDiscountAssignments',
    },
    {
      code: 'clientDiscountAssignments.read',
      description: 'View client discount assignments',
      category: 'clientDiscountAssignments',
    },
    {
      code: 'clientDiscountAssignments.update',
      description: 'Edit client discount assignments',
      category: 'clientDiscountAssignments',
    },
    {
      code: 'clientDiscountAssignments.delete',
      description: 'Delete client discount assignments',
      category: 'clientDiscountAssignments',
    },

    // Client documents management
    {
      code: 'clientDocuments.create',
      description: 'Create client documents',
      category: 'clientDocuments',
    },
    {
      code: 'clientDocuments.read',
      description: 'View client documents',
      category: 'clientDocuments',
    },
    {
      code: 'clientDocuments.update',
      description: 'Edit client documents',
      category: 'clientDocuments',
    },
    {
      code: 'clientDocuments.delete',
      description: 'Delete client documents',
      category: 'clientDocuments',
    },

    // Client requirements management
    {
      code: 'clientRequirements.create',
      description: 'Create client requirements',
      category: 'clientRequirements',
    },
    {
      code: 'clientRequirements.read',
      description: 'View client requirements',
      category: 'clientRequirements',
    },
    {
      code: 'clientRequirements.update',
      description: 'Edit client requirements',
      category: 'clientRequirements',
    },
    {
      code: 'clientRequirements.delete',
      description: 'Delete client requirements',
      category: 'clientRequirements',
    },

    // Client visas management
    { code: 'clientVisas.create', description: 'Create client visas', category: 'clientVisas' },
    { code: 'clientVisas.read', description: 'View client visas', category: 'clientVisas' },
    { code: 'clientVisas.update', description: 'Edit client visas', category: 'clientVisas' },
    { code: 'clientVisas.delete', description: 'Delete client visas', category: 'clientVisas' },

    // Visa applications management
    {
      code: 'visaApplications.create',
      description: 'Create visa applications',
      category: 'visaApplications',
    },
    {
      code: 'visaApplications.read',
      description: 'View visa applications',
      category: 'visaApplications',
    },
    {
      code: 'visaApplications.update',
      description: 'Edit visa applications',
      category: 'visaApplications',
    },
    {
      code: 'visaApplications.delete',
      description: 'Delete visa applications',
      category: 'visaApplications',
    },

    // Currencies management
    { code: 'currencies.create', description: 'Create currencies', category: 'currencies' },
    { code: 'currencies.read', description: 'View currencies', category: 'currencies' },
    { code: 'currencies.update', description: 'Edit currencies', category: 'currencies' },
    { code: 'currencies.delete', description: 'Delete currencies', category: 'currencies' },

    // Order payments management
    {
      code: 'orderPayments.create',
      description: 'Create order payments',
      category: 'orderPayments',
    },
    { code: 'orderPayments.read', description: 'View order payments', category: 'orderPayments' },
    { code: 'orderPayments.update', description: 'Edit order payments', category: 'orderPayments' },
    {
      code: 'orderPayments.delete',
      description: 'Delete order payments',
      category: 'orderPayments',
    },
    {
      code: 'orderPayments.canAcceptPayments',
      description: 'Accept and confirm payments',
      category: 'orderPayments',
    },
    {
      code: 'orderPayments.confirmWithoutDocument',
      description: 'Confirm payments without requiring a document',
      category: 'orderPayments',
    },
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
    {
      name: 'telegram',
      description: 'Telegram messenger contact',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" role="img" aria-label="Telegram icon"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/></svg>',
    },
    {
      name: 'whatsapp',
      description: 'WhatsApp messenger contact',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" role="img" aria-label="WhatsApp icon"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.488"/></svg>',
    },
    {
      name: 'wechat',
      description: 'WeChat messenger contact',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" role="img" aria-label="WeChat icon"><path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18 0 .659-.52 1.188-1.162 1.188-.642 0-1.162-.53-1.162-1.188 0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18 0 .659-.52 1.188-1.162 1.188-.642 0-1.162-.53-1.162-1.188 0-.651.52-1.18 1.162-1.18zm4.6 2.188c-2.909 0-5.269 2.192-5.269 4.894 0 2.702 2.36 4.894 5.269 4.894.636 0 1.249-.108 1.843-.289l1.645.963a.25.25 0 0 0 .125.037c.118 0 .213-.103.213-.23 0-.053-.021-.105-.035-.156l-.336-1.277a.428.428 0 0 1 .154-.483c1.577-1.155 2.599-2.906 2.599-4.859 0-2.702-2.36-4.894-5.208-4.894zm-1.966 2.982c.46 0 .833.378.833.843 0 .466-.373.844-.833.844-.459 0-.833-.378-.833-.844 0-.465.374-.843.833-.843zm3.931 0c.46 0 .833.378.833.843 0 .466-.373.844-.833.844-.459 0-.833-.378-.833-.844 0-.465.374-.843.833-.843z"/></svg>',
    },
    {
      name: 'zalo',
      description: 'Zalo messenger contact',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" role="img" aria-label="Zalo icon"><circle cx="12" cy="12" r="10" fill="#0068FF"/><path d="M8 8h8v1.5H8V8zm0 3h8v1.5H8V11zm0 3h5v1.5H8V14z" fill="white"/></svg>',
    },
  ];

  // Create contact methods with duplicate checking
  let contactMethodsCreated = 0;
  let contactMethodsUpdated = 0;
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
      // Update existing contact method if icon is missing or different
      if (!existing.icon || existing.icon !== contactMethod.icon) {
        await prisma.contactMethod.update({
          where: { id: existing.id },
          data: { icon: contactMethod.icon },
        });
        contactMethodsUpdated++;
      } else {
        contactMethodsExisted++;
      }
    }
  }

  console.log(
    `Processed ${contactMethods.length} contact methods: ${contactMethodsCreated} created, ${contactMethodsUpdated} updated, ${contactMethodsExisted} already existed`
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
        data: {
          name: citizenship.name,
          emoji: citizenship.emoji,
          abbreviation: citizenship.abbreviation,
          favourite: citizenship.favourite || false,
        },
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
