import { trpc } from '../../lib/trpc.js';

export const getAllUsersTrpcRoute = trpc.procedure.query(async ({ ctx }) => {
  const users = await ctx.prisma.user.findMany({
    orderBy: { firstName: 'asc' },
    select: {
      id: true,
      firstName: true,
      middleName: true,
      lastName: true,
      email: true,
      createdAt: true,
      updatedAt: true,
      roleAssignments: {
        select: {
          id: true,
          assignedAt: true,
          role: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
        orderBy: {
          assignedAt: 'desc',
        },
      },
      contactMethods: {
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
      },
    },
  });

  return { users };
});
