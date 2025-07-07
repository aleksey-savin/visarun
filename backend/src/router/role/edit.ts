import { roleUpdateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

export const zEditRoleTrpcInput = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  description: z.preprocess(
    val => (typeof val === 'string' && val.trim() === '' ? null : val),
    z.string().min(1).max(500).nullable().optional()
  ),
  permissions: z.array(z.string().uuid()).optional(),
});

export const editRoleTrpcRoute = roleUpdateProcedure
  .input(zEditRoleTrpcInput)
  .mutation(async ({ input, ctx }) => {
    // Verify role exists
    const existingRole = await ctx.prisma.role.findUnique({
      where: { id: input.id },
      include: {
        permissions: true,
      },
    });

    if (!existingRole) {
      throw new Error('Role not found');
    }

    // System role constraints
    if (existingRole.isSystem) {
      // Cannot modify name of system roles
      if (input.name && input.name !== existingRole.name) {
        throw new Error('Cannot modify the name of system roles');
      }

      // Cannot modify permissions for system roles
      if (input.permissions !== undefined) {
        throw new Error('Cannot modify permissions for system roles');
      }

      // Special constraints for specific system roles
      if (existingRole.name === 'admin') {
        // Admin role must have exactly one permission: global.fullAccess
        const fullAccessPermission = await ctx.prisma.permission.findUnique({
          where: { code: 'global.fullAccess' },
        });

        if (!fullAccessPermission) {
          throw new Error('System permission global.fullAccess not found');
        }

        // Ensure admin role has the correct permission
        const adminPermissions = await ctx.prisma.rolePermission.findMany({
          where: { roleId: existingRole.id },
        });

        if (
          adminPermissions.length !== 1 ||
          adminPermissions[0].permissionId !== fullAccessPermission.id
        ) {
          throw new Error(
            'Admin role permissions are corrupted. Please contact system administrator.'
          );
        }
      } else if (existingRole.name === 'client') {
        // Client role must have no permissions
        const clientPermissions = await ctx.prisma.rolePermission.findMany({
          where: { roleId: existingRole.id },
        });

        if (clientPermissions.length > 0) {
          throw new Error('Client role should not have any permissions.');
        }
      }
    }

    // If name is being changed, check if it's already in use
    if (input.name && input.name !== existingRole.name) {
      const roleWithName = await ctx.prisma.role.findUnique({
        where: { name: input.name },
      });

      if (roleWithName) {
        throw new Error('Role name is already in use');
      }
    }

    // Prepare data for update
    const updateData: Prisma.RoleUpdateInput = {};

    if (input.name) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;

    // Add current user as updatedBy if available
    if (ctx.user) {
      updateData.updatedBy = { connect: { id: ctx.user.id } };
    }

    // Start a transaction to update role and its permissions
    const updatedRole = await ctx.prisma.$transaction(async prisma => {
      // Update role basic info
      const role = await prisma.role.update({
        where: { id: input.id },
        data: updateData,
      });

      // Update permissions if provided (only for non-system roles)
      if (input.permissions && !existingRole.isSystem) {
        // First, delete existing role permissions
        await prisma.rolePermission.deleteMany({
          where: { roleId: input.id },
        });

        // Then, create new role permissions
        if (input.permissions.length > 0) {
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

          // Create new role permissions
          await Promise.all(
            input.permissions.map(permissionId =>
              prisma.rolePermission.create({
                data: {
                  roleId: input.id,
                  permissionId,
                },
              })
            )
          );
        }
      }

      return role;
    });

    return {
      role: {
        id: updatedRole.id,
        name: updatedRole.name,
        description: updatedRole.description,
      },
    };
  });
