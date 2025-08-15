import { PrismaClient } from '@prisma/client';
import { type Request, type Response } from 'express';
import { type TokenPayload } from '../utils/jwt.js';
import { logCustomAudit, getCurrentUser } from '../middleware/audit.js';
import { AuditAction } from '../types/audit.js';

const basePrisma = new PrismaClient();

// Create audit-wrapped Prisma client
function createAuditWrapper(prisma: PrismaClient) {
  return new Proxy(prisma, {
    get(target, prop) {
      const originalValue = target[prop as keyof PrismaClient];

      // Check if it's a model delegate
      if (typeof originalValue === 'object' && originalValue !== null && prop !== 'constructor') {
        return new Proxy(originalValue, {
          get(modelTarget, modelProp) {
            const modelPropStr = String(modelProp);
            const originalMethod = (modelTarget as Record<string, unknown>)[modelPropStr];

            if (typeof originalMethod === 'function') {
              // Wrap audit-able operations
              if (['create', 'update', 'delete', 'upsert'].includes(modelPropStr)) {
                return async function (...args: Record<string, unknown>[]) {
                  const modelName = prop as string;
                  const operation = modelPropStr;

                  // Skip audit for AuditLog model to prevent infinite loops
                  if (modelName === 'auditLog') {
                    return originalMethod.apply(modelTarget, args);
                  }

                  let oldData = null;
                  let entityId: string | undefined;

                  // For updates and deletes, fetch current data first
                  if (['update', 'delete', 'upsert'].includes(operation) && args[0]?.where) {
                    try {
                      const findMethod = (modelTarget as Record<string, unknown>).findUnique;
                      if (typeof findMethod === 'function') {
                        oldData = await findMethod.call(modelTarget, { where: args[0].where });
                        entityId = String(
                          (oldData as Record<string, unknown>)?.id ||
                            (oldData as Record<string, unknown>)?.cuid ||
                            ''
                        );
                      }
                    } catch (error) {
                      console.error('Failed to fetch old data for audit:', error);
                    }
                  }

                  // Execute the original operation
                  const result = await originalMethod.apply(modelTarget, args);

                  // Log audit after successful operation
                  try {
                    const user = getCurrentUser();
                    if (user) {
                      let action: AuditAction;
                      let newData: Record<string, unknown> | null = null;
                      const resultRecord = result as Record<string, unknown>;

                      switch (operation) {
                        case 'create':
                          action = AuditAction.CREATE;
                          newData = resultRecord;
                          entityId = String(resultRecord?.id || resultRecord?.cuid || '');
                          break;
                        case 'update':
                        case 'upsert':
                          action = AuditAction.UPDATE;
                          newData = resultRecord;
                          entityId =
                            entityId || String(resultRecord?.id || resultRecord?.cuid || '');
                          break;
                        case 'delete':
                          action = AuditAction.DELETE;
                          newData = null;
                          entityId =
                            entityId || String(resultRecord?.id || resultRecord?.cuid || '');
                          break;
                        default:
                          return result;
                      }

                      // Use setTimeout to avoid blocking the main operation
                      setTimeout(async () => {
                        try {
                          await logCustomAudit(
                            basePrisma,
                            action,
                            modelName,
                            entityId,
                            user,
                            oldData,
                            newData
                          );
                        } catch (auditError) {
                          console.error('Audit logging failed:', auditError);
                        }
                      }, 0);
                    }
                  } catch (error) {
                    console.error('Audit setup failed:', error);
                  }

                  return result;
                };
              }
            }

            return originalMethod;
          },
        });
      }

      return originalValue;
    },
  });
}

const prisma = createAuditWrapper(basePrisma);

// Combined context type that includes auth
export type AppContext = {
  prisma: PrismaClient;
  req?: Request;
  res?: Response;
  user?: TokenPayload; // From auth middleware
  stop: () => Promise<void>;
};

// Create the base context without user information
export const createAppContext = ({
  req,
  res,
}: { req?: Request; res?: Response } = {}): AppContext => {
  return {
    prisma,
    req,
    res,
    stop: async () => {
      await basePrisma.$disconnect();
    },
  };
};
