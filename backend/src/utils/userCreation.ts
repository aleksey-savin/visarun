import { PrismaClient, Prisma } from '@prisma/client';
import { hashPassword } from './getPasswordHash.js';

export interface CreateUserOptions {
  email?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  password?: string;
  mustChangePassword?: boolean;
  isActive?: boolean;
  roleIds?: string[];
  contactMethods?: Array<{
    contactMethodId: string;
    value: string;
    url?: string;
  }>;
}

export interface CreateUserResult {
  user: {
    id: string;
    email: string | null;
    firstName: string;
    middleName: string | null;
    lastName: string;
    mustChangePassword: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
  contactMethods: Array<{
    id: string;
    value: string | null;
    url: string | null;
    method: {
      id: string;
      name: string;
      description: string | null;
    };
  }>;
  roles: Array<{
    id: string;
    name: string;
    description: string | null;
  }>;
}

/**
 * Creates a user with proper validation and type safety
 */
export async function createUserWithValidation(
  prisma: PrismaClient,
  options: CreateUserOptions
): Promise<CreateUserResult> {
  const {
    email,
    firstName,
    middleName,
    lastName,
    password,
    mustChangePassword = false,
    isActive = true,
    roleIds = [],
    contactMethods = [],
  } = options;

  // Validate email uniqueness if provided
  if (email) {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }
  }

  // Validate contact methods exist if provided
  if (contactMethods.length > 0) {
    const contactMethodIds = contactMethods.map(cm => cm.contactMethodId);
    const existingContactMethods = await prisma.contactMethod.findMany({
      where: { id: { in: contactMethodIds } },
    });

    if (existingContactMethods.length !== contactMethodIds.length) {
      throw new Error('One or more contact methods do not exist');
    }
  }

  // Validate roles exist if provided
  if (roleIds.length > 0) {
    const existingRoles = await prisma.role.findMany({
      where: { id: { in: roleIds } },
    });

    if (existingRoles.length !== roleIds.length) {
      throw new Error('One or more roles do not exist');
    }
  }

  // Generate password if not provided
  const finalPassword = password || `temp${Math.random().toString(36).slice(2)}`;
  const hashedPassword = await hashPassword(finalPassword);

  // Determine isActive based on email availability and explicit setting
  const finalIsActive = email ? isActive : false; // If no email, must be inactive

  // Create user in transaction
  const result = await prisma.$transaction(async tx => {
    // Create the user
    const newUser = await tx.user.create({
      data: {
        email: email ?? null,
        firstName,
        middleName: middleName ?? null,
        lastName,
        password: hashedPassword,
        mustChangePassword,
        isActive: finalIsActive,
      } as Prisma.UserCreateInput,
    });

    // Create contact methods if provided
    let userContactMethods: Array<{
      id: string;
      value: string | null;
      url: string | null;
      method: {
        id: string;
        name: string;
        description: string | null;
      };
    }> = [];
    if (contactMethods.length > 0) {
      await tx.userContactMethod.createMany({
        data: contactMethods.map(cm => ({
          userId: newUser.id,
          contactMethodId: cm.contactMethodId,
          value: cm.value,
          url: cm.url ?? null,
        })),
      });

      // Fetch created contact methods with their details
      const rawContactMethods = await tx.userContactMethod.findMany({
        where: {
          userId: newUser.id,
          method: { isNot: null },
        },
        include: {
          method: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      userContactMethods = rawContactMethods.map(cm => ({
        id: cm.id,
        value: cm.value,
        url: cm.url,
        method: cm.method!,
      }));
    }

    // Create role assignments if provided
    let userRoles: Array<{
      id: string;
      name: string;
      description: string | null;
    }> = [];
    if (roleIds.length > 0) {
      await tx.userRoleAssignment.createMany({
        data: roleIds.map(roleId => ({
          userId: newUser.id,
          roleId: roleId,
        })),
      });

      // Fetch assigned roles with their details
      const roleAssignments = await tx.userRoleAssignment.findMany({
        where: { userId: newUser.id },
        include: {
          role: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
      });

      userRoles = roleAssignments.map(assignment => assignment.role);
    }

    return {
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        middleName: newUser.middleName,
        lastName: newUser.lastName,
        mustChangePassword: newUser.mustChangePassword,
        isActive: Boolean((newUser as { isActive?: boolean }).isActive ?? false), // Type assertion until Prisma types are updated
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt,
      },
      contactMethods: userContactMethods,
      roles: userRoles,
    };
  });

  return result;
}

/**
 * Validates user creation requirements based on business rules
 */
export function validateUserCreationRequirements(options: {
  email?: string;
  isActive?: boolean;
}): void {
  const { email } = options;

  // If no email, isActive must be false (this is handled automatically in createUserWithValidation)
  if (!email && options.isActive === true) {
    throw new Error('Users without email addresses cannot be active');
  }
}

/**
 * Creates a user for client creation scenarios with specific business rules
 */
export async function createUserForClient(
  prisma: PrismaClient,
  userData: {
    email?: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    password?: string;
    contactMethods?: Array<{
      contactMethodId?: string;
      value?: string;
      url?: string;
    }>;
  }
): Promise<CreateUserResult> {
  // Validate requirements
  validateUserCreationRequirements(userData);

  // Find the client role
  const clientRole = await prisma.role.findFirst({
    where: { name: 'client' },
  });

  if (!clientRole) {
    throw new Error('Client role not found in database');
  }

  // Filter and validate contact methods
  const validContactMethods =
    userData.contactMethods
      ?.filter(cm => cm.contactMethodId && cm.value)
      .map(cm => ({
        contactMethodId: cm.contactMethodId!,
        value: cm.value!,
        url: cm.url,
      })) || [];

  // Create user with client-specific defaults
  return createUserWithValidation(prisma, {
    email: userData.email,
    firstName: userData.firstName,
    middleName: userData.middleName,
    lastName: userData.lastName,
    password: userData.password,
    mustChangePassword: true, // Always true for client-created users
    isActive: false, // Always false for client-created users
    roleIds: [clientRole.id], // Assign client role by default
    contactMethods: validContactMethods,
  });
}
