import { Prisma, PrismaClient } from '@prisma/client';
import { type TokenPayload } from '../utils/jwt.js';
import { AuditAction, type AuditContext } from '../types/audit.js';

// Type definitions for Prisma operations
interface PrismaModelDelegate {
  findUnique?: (args: {
    where: Record<string, unknown>;
  }) => Promise<Record<string, unknown> | null>;
}

interface PrismaClientWithModels {
  [key: string]: PrismaModelDelegate;
}

interface PrismaClientWithAuditLog {
  AuditLog: {
    create: (args: {
      data: {
        action: string;
        entityType: string;
        entityId: string;
        userId: string;
        performedAt: Date;
        diff: unknown;
      };
    }) => Promise<unknown>;
  };
}

// Extract entity type from Prisma model name
function getEntityType(model: string): string {
  return model;
}

// Extract entity ID from data
function extractEntityId(data: Record<string, unknown> | null | undefined): string | undefined {
  if (!data) return undefined;
  return (data.id as string) || (data.cuid as string) || undefined;
}

// Get the current user from AsyncLocalStorage or context
let currentUser: TokenPayload | undefined;

export function setCurrentUser(user: TokenPayload | undefined) {
  currentUser = user;
}

export function getCurrentUser(): TokenPayload | undefined {
  return currentUser;
}

// Check if a value represents a Prisma relation object
function isPrismaRelation(value: unknown): boolean {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    'id' in (value as Record<string, unknown>)
  );
}

// Normalize data by removing relation objects and keeping only trackable fields
function normalizeDataForComparison(
  data: Record<string, unknown> | null
): Record<string, unknown> | null {
  if (!data) return null;

  const normalized: Record<string, unknown> = {};

  Object.entries(data).forEach(([key, value]) => {
    // Skip timestamp fields
    if (key === 'createdAt' || key === 'updatedAt') {
      return;
    }

    // Skip relation objects that are just populated for convenience
    // We only want to track actual foreign key changes
    if (isPrismaRelation(value) && !key.endsWith('Id')) {
      return;
    }

    // For foreign key fields, extract the ID if it's a relation object
    if (key.endsWith('Id') && isPrismaRelation(value)) {
      normalized[key] = (value as Record<string, unknown>).id;
    } else if (!isPrismaRelation(value)) {
      normalized[key] = value;
    }
  });

  return normalized;
}

// Calculate only the changed fields between old and new data
function calculateChanges(
  oldData: Record<string, unknown> | null,
  newData: Record<string, unknown> | null
): Record<string, { from: unknown; to: unknown }> {
  const changes: Record<string, { from: unknown; to: unknown }> = {};

  // Normalize both datasets to ensure fair comparison
  const normalizedOldData = normalizeDataForComparison(oldData);
  const normalizedNewData = normalizeDataForComparison(newData);

  if (!normalizedOldData && normalizedNewData) {
    // New record created - store all fields as changes
    Object.entries(normalizedNewData).forEach(([field, value]) => {
      changes[field] = { from: null, to: value };
    });
  } else if (normalizedOldData && !normalizedNewData) {
    // Record deleted - store all fields that were removed
    Object.entries(normalizedOldData).forEach(([field, value]) => {
      changes[field] = { from: value, to: null };
    });
  } else if (normalizedOldData && normalizedNewData) {
    // Record updated - find differences
    const allFields = new Set([
      ...Object.keys(normalizedOldData),
      ...Object.keys(normalizedNewData),
    ]);

    allFields.forEach(field => {
      const oldValue = normalizedOldData[field];
      const newValue = normalizedNewData[field];

      // Only store if values are actually different
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes[field] = { from: oldValue, to: newValue };
      }
    });
  }

  return changes;
}

// Create audit log entry
async function createAuditLog(prisma: PrismaClient, context: AuditContext): Promise<void> {
  try {
    // Skip if no user ID (required field)
    if (!context.user?.id) {
      return;
    }

    // Calculate only the changed fields
    const changes = calculateChanges(context.oldData, context.newData);

    // Skip if no actual changes (shouldn't happen, but safety check)
    if (Object.keys(changes).length === 0 && context.action !== AuditAction.LOGIN) {
      return;
    }

    // For login events, store minimal context data
    const diff = context.action === AuditAction.LOGIN ? context.newData : changes;

    // Use correct model name casing for AuditLog
    await (prisma as unknown as PrismaClientWithAuditLog).AuditLog.create({
      data: {
        action: context.action.toLowerCase(),
        entityType: context.entityType,
        entityId: context.entityId || '',
        userId: context.user.id,
        performedAt: new Date(),
        diff: diff,
      },
    });
  } catch (error) {
    // Log error but don't fail the original operation
    console.error('Failed to create audit log:', error);
  }
}

// Prisma middleware for audit logging
export function createAuditMiddleware(): Prisma.Middleware {
  return async (params, next) => {
    const { model, action } = params;

    // Skip audit logging for AuditLog model to prevent infinite loops
    if (model === ('AuditLog' as Prisma.ModelName)) {
      return next(params);
    }

    // Skip if no model (for raw queries, etc.)
    if (!model) {
      return next(params);
    }

    const entityType = getEntityType(model);
    const user = getCurrentUser();

    let oldData: Record<string, unknown> | null = null;
    let auditAction: AuditAction;
    let entityId: string | undefined;

    // Handle different actions
    switch (action) {
      case 'create':
      case 'createMany':
        auditAction = AuditAction.CREATE;
        break;
      case 'update':
      case 'updateMany':
      case 'upsert':
        auditAction = AuditAction.UPDATE;
        break;
      case 'delete':
      case 'deleteMany':
        auditAction = AuditAction.DELETE;
        break;
      default:
        // Skip audit for read operations
        return next(params);
    }

    // For updates and deletes, fetch the current data before the operation
    if (action === 'update' || action === 'delete' || action === 'upsert') {
      try {
        if (params.args?.where) {
          // Create a new Prisma client instance to avoid middleware recursion
          const tempPrisma = new PrismaClient();

          // Use the model name with correct casing (as it appears in the schema)
          const prismaDelegate = (tempPrisma as unknown as PrismaClientWithModels)[model];

          if (prismaDelegate && typeof prismaDelegate.findUnique === 'function') {
            const currentData = await prismaDelegate.findUnique({
              where: params.args.where,
            });
            if (currentData) {
              oldData = currentData as Record<string, unknown>;
              entityId = extractEntityId(currentData as Record<string, unknown>);
            }
          } else {
            console.warn(`No findUnique method found for model: ${model}`);
          }
          await tempPrisma.$disconnect();
        }
      } catch (error) {
        console.error('Failed to fetch old data for audit:', error);
      }
    } else if (action === 'updateMany' || action === 'deleteMany') {
      // For batch operations, we'll just log that they happened
      // without detailed before/after data due to complexity
      entityId = 'batch-operation';
    }

    // Execute the original operation
    const result = await next(params);

    // Prepare audit context
    const auditContext: AuditContext = {
      user,
      action: auditAction,
      entityType,
      entityId,
      oldData: oldData || null,
      newData: null,
    };

    // Set entity ID and new data based on the operation result
    try {
      if (action === 'create') {
        auditContext.newData = result as Record<string, unknown>;
        auditContext.entityId = extractEntityId(result);
      } else if (action === 'createMany') {
        auditContext.newData = { count: (result as { count: number }).count };
        auditContext.entityId = 'batch-create';
      } else if (action === 'update' || action === 'upsert') {
        auditContext.newData = result as Record<string, unknown>;
        if (!auditContext.entityId) {
          auditContext.entityId = extractEntityId(result);
        }
      } else if (action === 'updateMany') {
        auditContext.newData = { count: (result as { count: number }).count };
        auditContext.entityId = 'batch-update';
      } else if (action === 'delete') {
        auditContext.newData = null;
        if (!auditContext.entityId) {
          auditContext.entityId = extractEntityId(result);
        }
      } else if (action === 'deleteMany') {
        auditContext.newData = { count: (result as { count: number }).count };
        auditContext.entityId = 'batch-delete';
      }

      // Create audit log entry (using a new Prisma instance to avoid middleware conflicts)
      const auditPrisma = new PrismaClient();
      await createAuditLog(auditPrisma, auditContext);
      await auditPrisma.$disconnect();
    } catch (error) {
      console.error('Failed to create audit log:', error);
    }

    return result;
  };
}

// Helper function to manually log custom audit events (like login)
export async function logCustomAudit(
  prisma: PrismaClient,
  action: AuditAction,
  entityType: string,
  entityId?: string,
  user?: TokenPayload,
  oldData?: Record<string, unknown> | null,
  newData?: Record<string, unknown> | null
): Promise<void> {
  const auditContext: AuditContext = {
    user: user || getCurrentUser(),
    action,
    entityType,
    entityId,
    oldData: oldData || null,
    newData: newData || null,
  };

  await createAuditLog(prisma, auditContext);
}
