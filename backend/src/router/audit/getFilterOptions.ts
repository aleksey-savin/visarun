import { auditManageProcedure } from '../../lib/trpc.js';

export const getFilterOptionsTrpcRoute = auditManageProcedure.query(async ({ ctx }) => {
  // Get distinct entity types from audit logs
  const entityTypes = await (
    ctx.prisma as unknown as {
      auditLog: { findMany: (args: unknown) => Promise<Array<{ entityType: string }>> };
    }
  ).auditLog.findMany({
    select: {
      entityType: true,
    },
    distinct: ['entityType'],
    orderBy: {
      entityType: 'asc',
    },
  });

  // Get users who have performed audit actions
  const users = await (
    ctx.prisma as unknown as {
      auditLog: {
        findMany: (args: unknown) => Promise<
          Array<{
            user: {
              id: string;
              email: string;
              firstName: string;
              lastName: string;
            } | null;
          }>
        >;
      };
    }
  ).auditLog.findMany({
    select: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    where: {
      user: {
        isNot: null,
      },
    },
    distinct: ['userId'],
    orderBy: {
      user: {
        firstName: 'asc',
      },
    },
  });

  // Get available actions
  const actions = [
    { value: 'CREATE', label: 'Create' },
    { value: 'UPDATE', label: 'Update' },
    { value: 'DELETE', label: 'Delete' },
    { value: 'LOGIN', label: 'Login' },
  ];

  return {
    entityTypes: entityTypes.map(item => ({
      value: item.entityType,
      label: item.entityType,
    })),
    users: users
      .filter(item => item.user !== null)
      .map(item => ({
        value: item.user!.id,
        label: `${item.user!.firstName} ${item.user!.lastName}`.trim(),
        email: item.user!.email,
      })),
    actions,
  };
});
