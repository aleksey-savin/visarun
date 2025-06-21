import { trpc } from '../../lib/trpc.js';

export const getAllRolesTrpcRoute = trpc.procedure.query(async ({ ctx }) => {
  const roles = await ctx.prisma.role.findMany({
    where: {
      isActive: true,
    },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      description: true,
      isSystem: true,
    },
  });

  return { roles };
});
