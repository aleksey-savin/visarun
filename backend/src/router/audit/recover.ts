import { auditManageProcedure } from '../../lib/trpc.js';
import { AuditAction, type AuditLogEntry } from '../../types/audit.js';
import { logCustomAudit } from '../../middleware/audit.js';
import { z } from 'zod';

export const zRecoverEntityTrpcInput = z.object({
  auditLogId: z.string().uuid(),
  options: z
    .object({
      generateNewId: z.boolean().default(false),
      dryRun: z.boolean().default(true),
      forceRecover: z.boolean().default(false),
    })
    .default({}),
});

export const recoverEntityTrpcRoute = auditManageProcedure
  .input(zRecoverEntityTrpcInput)
  .mutation(async ({ input, ctx }) => {
    const { auditLogId, options } = input;

    // Get the audit log entry
    const auditLog: AuditLogEntry = await (
      ctx.prisma as unknown as {
        auditLog: { findUnique: (args: unknown) => Promise<AuditLogEntry> };
      }
    ).auditLog.findUnique({
      where: { id: auditLogId },
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

    if (auditLog.action.toUpperCase() !== 'DELETE') {
      throw new Error('Can only recover entities from DELETE operations');
    }

    // Reconstruct the original data from the diff
    const recoveredData: Record<string, unknown> = {};
    const conflicts: string[] = [];

    // Extract data from the diff format
    if (auditLog.diff && typeof auditLog.diff === 'object') {
      const diff = auditLog.diff as Record<string, { from: unknown; to: unknown }>;

      Object.entries(diff).forEach(([field, change]) => {
        if (change && typeof change === 'object' && 'from' in change && change.from !== null) {
          recoveredData[field] = change.from;
        }
      });
    }

    if (Object.keys(recoveredData).length === 0) {
      throw new Error('No recoverable data found in audit log');
    }

    // Determine the entity ID for recovery
    let entityId = auditLog.entityId;
    let useOriginalId = true;

    // Check if entity with original ID already exists
    const modelName = auditLog.entityType.toLowerCase();
    let existingEntity = null;

    try {
      existingEntity = await (
        ctx.prisma as unknown as Record<string, { findUnique: (args: unknown) => Promise<unknown> }>
      )[modelName].findUnique({
        where: { id: entityId },
      });
    } catch (error) {
      // Model might not exist or other error
      throw new Error(`Cannot access ${auditLog.entityType} model: ${error}`);
    }

    if (existingEntity) {
      if (options.generateNewId) {
        // Generate a new UUID
        const { randomUUID } = await import('crypto');
        entityId = randomUUID();
        useOriginalId = false;
        conflicts.push(`Original ID ${auditLog.entityId} exists. Will use new ID: ${entityId}`);
      } else if (!options.forceRecover) {
        conflicts.push(`Entity with ID ${auditLog.entityId} already exists`);
      } else {
        conflicts.push(`Will overwrite existing entity with ID ${auditLog.entityId}`);
      }
    }

    // Set the ID in recovered data
    recoveredData.id = entityId;

    // If dry run, return preview without executing
    if (options.dryRun) {
      return {
        success: true,
        dryRun: true,
        recoveredData,
        conflicts,
        originalId: auditLog.entityId,
        newId: entityId,
        useOriginalId,
        entityType: auditLog.entityType,
        deletedBy: auditLog.user
          ? {
              id: auditLog.user.id,
              email: auditLog.user.email,
              name: `${auditLog.user.firstName} ${auditLog.user.lastName}`.trim(),
            }
          : null,
        deletedAt: auditLog.performedAt,
      };
    }

    // Check for conflicts and fail if not forced
    if (conflicts.length > 0 && !options.forceRecover && !options.generateNewId) {
      throw new Error(`Recovery conflicts detected: ${conflicts.join(', ')}`);
    }

    // Perform the actual recovery
    let recoveredEntity;
    try {
      if (existingEntity && options.forceRecover && useOriginalId) {
        // Update existing entity
        recoveredEntity = await (
          ctx.prisma as unknown as Record<string, { update: (args: unknown) => Promise<unknown> }>
        )[modelName].update({
          where: { id: entityId },
          data: recoveredData,
        });
      } else {
        // Create new entity
        recoveredEntity = await (
          ctx.prisma as unknown as Record<string, { create: (args: unknown) => Promise<unknown> }>
        )[modelName].create({
          data: recoveredData,
        });
      }

      // Log the recovery action
      await logCustomAudit(
        ctx.prisma,
        AuditAction.CREATE,
        auditLog.entityType,
        entityId,
        ctx.user,
        null,
        {
          ...recoveredData,
          recoveredFromAuditLogId: auditLogId,
          recoveryMethod: useOriginalId ? 'original-id' : 'new-id',
          recoveryTimestamp: new Date(),
        }
      );

      return {
        success: true,
        dryRun: false,
        recoveredEntity,
        conflicts,
        originalId: auditLog.entityId,
        newId: entityId,
        useOriginalId,
        entityType: auditLog.entityType,
        deletedBy: auditLog.user
          ? {
              id: auditLog.user.id,
              email: auditLog.user.email,
              name: `${auditLog.user.firstName} ${auditLog.user.lastName}`.trim(),
            }
          : null,
        deletedAt: auditLog.performedAt,
        recoveredAt: new Date(),
      };
    } catch (error) {
      throw new Error(`Failed to recover entity: ${error}`);
    }
  });
