import { roleCreateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zCreateRoleTrpcInput = z.object({
  name: z.string().min(1).max(100),
  description: z.preprocess(
    val => (typeof val === 'string' && val.trim() === '' ? null : val),
    z.string().min(1).max(500).nullable().optional()
  ),
  permissions: z.array(z.string().uuid()).optional(),
});

export const createRoleTrpcRoute = roleCreateProcedure
  .input(zCreateRoleTrpcInput)
  .mutation(async ({ input, ctx }) => {
    // Check if role name already exists
    const existingRole = await ctx.prisma.role.findUnique({
      where: { name: input.name },
    });

    if (existingRole) {
      throw new Error('Role name already exists');
    }

    // Prevent creation of roles with system role names
    const systemRoleNames = ['admin', 'client'];
    if (systemRoleNames.includes(input.name.toLowerCase())) {
      throw new Error(
        `Cannot create role with name "${input.name}". This name is reserved for system roles.`
      );
    }

    // Create role and assign permissions in a transaction
    const newRole = await ctx.prisma.$transaction(async prisma => {
      // Create the role
      const role = await prisma.role.create({
        data: {
          name: input.name,
          description: input.description || null,
          isSystem: false,
          isActive: true,
        },
      });

      // Create role permissions if provided
      if (input.permissions && input.permissions.length > 0) {
        // Validate that all permissions exist
        const existingPermissions = await prisma.permission.findMany({
          where: { id: { in: input.permissions } },
          select: { id: true },
        });

        const existingPermissionIds = existingPermissions.map(p => p.id);
        const invalidPermissions = input.permissions.filter(
          id => !existingPermissionIds.includes(id)
        );

        if (invalidPermissions.length > 0) {
          throw new Error(`Invalid permission IDs: ${invalidPermissions.join(', ')}`);
        }

        // Remove duplicates and create role permissions
        const uniquePermissions = [...new Set(input.permissions)];

        for (const permissionId of uniquePermissions) {
          await prisma.rolePermission.create({
            data: {
              roleId: role.id,
              permissionId,
            },
          });
        }
      }

      return role;
    });

    return {
      role: {
        id: newRole.id,
        name: newRole.name,
        description: newRole.description,
        isSystem: newRole.isSystem,
      },
    };
  });
