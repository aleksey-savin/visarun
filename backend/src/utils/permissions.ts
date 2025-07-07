import { PrismaClient } from '@prisma/client';

// Get user permissions from database
export async function getUserPermissions(userId: string, prisma: PrismaClient): Promise<string[]> {
  const userWithRoles = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roleAssignments: {
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!userWithRoles) {
    return [];
  }

  const permissions = new Set<string>();

  for (const assignment of userWithRoles.roleAssignments) {
    for (const rolePermission of assignment.role.permissions) {
      permissions.add(rolePermission.permission.code);
    }
  }

  return Array.from(permissions);
}

// Check if user has a specific permission
export function hasPermission(userPermissions: string[], requiredPermission: string): boolean {
  // Check for global full access first
  if (userPermissions.includes('global.fullAccess')) {
    return true;
  }

  return userPermissions.includes(requiredPermission);
}

// Check if user has any of the specified permissions
export function hasAnyPermission(
  userPermissions: string[],
  requiredPermissions: string[]
): boolean {
  // Check for global full access first
  if (userPermissions.includes('global.fullAccess')) {
    return true;
  }

  return requiredPermissions.some(permission => userPermissions.includes(permission));
}

// Permission middleware factory
export function requirePermission(permission: string) {
  return async (ctx: { user?: { permissions?: string[] } }, next: () => Promise<unknown>) => {
    if (!ctx.user) {
      throw new Error('Not authenticated');
    }

    if (!hasPermission(ctx.user.permissions || [], permission)) {
      throw new Error(`Permission required: ${permission}`);
    }

    return next();
  };
}
