import { trpc } from '../../lib/trpc.js';
import { z } from 'zod';

export const getOneRoleTrpcInput = z.object({
  id: z.string().uuid(),
});

export const getOneRoleTrpcRoute = trpc.procedure
  .input(getOneRoleTrpcInput)
  .query(async ({ input, ctx }) => {
    const role = await ctx.prisma.role.findUnique({
      where: { id: input.id },
      select: {
        id: true,
        name: true,
        description: true,
        isSystem: true,
        permissions: {
          select: {
            permissionId: true,
            permission: {
              select: {
                id: true,
                code: true,
                description: true,
                category: true,
              },
            },
          },
        },
      },
    });

    if (!role) {
      throw new Error(`Role with ID ${input.id} not found`);
    }

    // Extract permission IDs for easier handling in the frontend
    const permissionIds = role.permissions.map(p => p.permissionId);

    return {
      role: {
        id: role.id,
        name: role.name,
        description: role.description,
        isSystem: role.isSystem,
        permissions: role.permissions.map(p => p.permission),
        permissionIds,
      },
    };
  });
