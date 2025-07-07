import { trpc } from '../../lib/trpc.js';

export const getAllPermissionsTrpcRoute = trpc.procedure.query(async ({ ctx }) => {
  const permissions = await ctx.prisma.permission.findMany({
    orderBy: [{ category: 'asc' }, { code: 'asc' }],
    select: {
      id: true,
      code: true,
      description: true,
      category: true,
    },
  });

  // Group permissions by category for easier UI rendering
  const groupedPermissions = permissions.reduce(
    (acc, permission) => {
      const category = permission.category || 'Uncategorized';

      if (!acc[category]) {
        acc[category] = [];
      }

      acc[category].push(permission);
      return acc;
    },
    {} as Record<string, typeof permissions>
  );

  return {
    permissions,
    groupedPermissions,
  };
});
