import { adminProcedure } from '../../lib/trpc.js';
import {
  analyzeChanges,
  getChangeSummary,
  sanitizeAuditData,
  getEntityDisplayName,
  formatChangeDescription,
  extractOldNewData,
} from '../../utils/auditHelpers.js';
import { type JsonValue } from '@prisma/client/runtime/library';
import { AuditAction, type AuditLogEntry, type EnhancedAuditLog } from '../../types/audit.js';
import { z } from 'zod';

export const zGetOneAuditLogTrpcInput = z.object({
  id: z.string().cuid(),
});

export const getOneAuditLogTrpcRoute = adminProcedure
  .input(zGetOneAuditLogTrpcInput)
  .query(async ({ input, ctx }) => {
    const auditLog: AuditLogEntry = await (
      ctx.prisma as unknown as {
        auditLog: { findUnique: (args: unknown) => Promise<AuditLogEntry> };
      }
    ).auditLog.findUnique({
      where: {
        id: input.id,
      },
      include: {
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

    if (!auditLog) {
      throw new Error('Audit log not found');
    }

    // Handle new diff-only format
    const sanitizedDiff = sanitizeAuditData(auditLog.diff) as JsonValue | null;
    const changes = analyzeChanges(null, sanitizedDiff);
    const changeSummary = getChangeSummary(null, sanitizedDiff);

    // Extract old/new data for display purposes
    const { oldData, newData } = extractOldNewData(sanitizedDiff);

    const enhancedAuditLog: EnhancedAuditLog & {
      changes: Array<{
        field: string;
        oldValue: unknown;
        newValue: unknown;
        changeType: 'added' | 'modified' | 'removed';
        description: string;
      }>;
    } = {
      id: auditLog.id,
      action: auditLog.action.toUpperCase() as AuditAction,
      entityType: auditLog.entityType,
      entityId: auditLog.entityId,
      userId: auditLog.userId,
      oldData: oldData,
      newData: newData,
      performedAt: auditLog.performedAt,
      changeSummary,
      changeCount: changes.length,
      changes: changes.map(change => ({
        field: change.field,
        oldValue: change.oldValue,
        newValue: change.newValue,
        changeType: change.changeType,
        description: formatChangeDescription(change),
      })),
      entityDisplayName: getEntityDisplayName(
        auditLog.entityType,
        (newData || oldData) as Record<string, unknown> | null
      ),
      user: auditLog.user
        ? {
            id: auditLog.user.id,
            email: auditLog.user.email,
            name: `${auditLog.user.firstName} ${auditLog.user.lastName}`.trim(),
          }
        : null,
    };

    return {
      auditLog: enhancedAuditLog,
    };
  });
