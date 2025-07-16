import { auditManageProcedure } from '../../lib/trpc.js';

// Type definitions for audit log data
type AuditLogWithUser = {
  entityType: string;
  userId: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  } | null;
};

export const getFilterOptionsTrpcRoute = auditManageProcedure.query(async ({ ctx }) => {
  try {
    console.log('🔍 Fetching audit filter options...');

    // Get all audit logs first
    const allAuditLogs = await (
      ctx.prisma as unknown as {
        auditLog: {
          findMany: (args: unknown) => Promise<Array<AuditLogWithUser>>;
        };
      }
    ).auditLog.findMany({
      select: {
        entityType: true,
        userId: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    console.log(`📊 Found ${allAuditLogs.length} audit log entries`);
    console.log('📋 Sample audit log:', allAuditLogs[0]);

    // Extract unique entity types
    const entityTypeSet = new Set<string>();
    allAuditLogs.forEach(log => {
      if (log.entityType) {
        entityTypeSet.add(log.entityType);
      }
    });
    const entityTypes = Array.from(entityTypeSet)
      .sort()
      .map(type => ({
        value: type,
        label: type,
      }));

    console.log(`🏷️  Found ${entityTypes.length} entity types:`, entityTypes);

    // Extract unique users
    const userMap = new Map();
    allAuditLogs.forEach(log => {
      if (log.user && log.user.id) {
        userMap.set(log.user.id, log.user);
      }
    });
    const users = Array.from(userMap.values())
      .map(user => ({
        value: user.id,
        label: `${user.firstName} ${user.lastName}`.trim() || user.email,
        email: user.email,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));

    console.log(`👥 Found ${users.length} unique users:`, users);

    // Static actions
    const actions = [
      { value: 'CREATE', label: 'Create' },
      { value: 'UPDATE', label: 'Update' },
      { value: 'DELETE', label: 'Delete' },
      { value: 'LOGIN', label: 'Login' },
    ];

    console.log('✅ Returning filter options:', {
      entityTypesCount: entityTypes.length,
      usersCount: users.length,
      actionsCount: actions.length,
    });

    return {
      entityTypes,
      users,
      actions,
    };
  } catch (error: unknown) {
    console.error('❌ Error fetching filter options:', error);
    console.error('Stack trace:', (error as Error)?.stack);
    return {
      entityTypes: [],
      users: [],
      actions: [
        { value: 'CREATE', label: 'Create' },
        { value: 'UPDATE', label: 'Update' },
        { value: 'DELETE', label: 'Delete' },
        { value: 'LOGIN', label: 'Login' },
      ],
    };
  }
});
