import { auditManageProcedure } from '../../lib/trpc.js';
import {
  analyzeChanges,
  getChangeSummary,
  sanitizeAuditData,
  getEntityDisplayName,
  extractOldNewData,
} from '../../utils/auditHelpers.js';
import { type JsonValue } from '@prisma/client/runtime/library';
import {
  AuditAction,
  type AuditLogEntry,
  type EnhancedAuditLog,
  type AuditLogPagination,
} from '../../types/audit.js';
import { z } from 'zod';

export const zGetAllAuditLogsTrpcInput = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  entityType: z.string().optional(),
  action: z.nativeEnum(AuditAction).optional(),
  userId: z.string().uuid().optional(),
  entityId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const getAllAuditLogsTrpcRoute = auditManageProcedure
  .input(zGetAllAuditLogsTrpcInput)
  .query(async ({ input, ctx }) => {
    const { page, limit, entityType, action, userId, entityId, startDate, endDate } = input;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: {
      entityType?: string;
      action?: string;
      userId?: string;
      entityId?: string;
      performedAt?: {
        gte?: Date;
        lte?: Date;
      };
    } = {};

    if (entityType) {
      where.entityType = entityType;
    }

    if (action) {
      where.action = action.toLowerCase();
    }

    if (userId) {
      where.userId = userId;
    }

    if (entityId) {
      where.entityId = entityId;
    }

    if (startDate || endDate) {
      where.performedAt = {};
      if (startDate) {
        where.performedAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.performedAt.lte = new Date(endDate);
      }
    }

    // Get total count
    const total = await (
      ctx.prisma as unknown as { auditLog: { count: (args: unknown) => Promise<number> } }
    ).auditLog.count({ where });

    // Get audit logs with user information
    const auditLogs = await (
      ctx.prisma as unknown as {
        auditLog: { findMany: (args: unknown) => Promise<AuditLogEntry[]> };
      }
    ).auditLog.findMany({
      where,
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
      orderBy: {
        performedAt: 'desc',
      },
      skip,
      take: limit,
    });

    const enhancedAuditLogs: EnhancedAuditLog[] = auditLogs.map((log: AuditLogEntry) => {
      // Handle new diff-only format
      const sanitizedDiff = sanitizeAuditData(log.diff) as JsonValue | null;
      const changes = analyzeChanges(null, sanitizedDiff);
      const changeSummary = getChangeSummary(null, sanitizedDiff);

      // Extract old/new data for display purposes
      const { oldData, newData } = extractOldNewData(sanitizedDiff);

      return {
        id: log.id,
        action: log.action.toUpperCase() as AuditAction,
        entityType: log.entityType,
        entityId: log.entityId,
        userId: log.userId,
        oldData: oldData,
        newData: newData,
        performedAt: log.performedAt,
        changeSummary,
        changeCount: changes.length,
        entityDisplayName: getEntityDisplayName(
          log.entityType,
          (newData || oldData) as Record<string, unknown> | null
        ),
        user: log.user
          ? {
              id: log.user.id,
              email: log.user.email,
              name: `${log.user.firstName} ${log.user.lastName}`.trim(),
            }
          : null,
      };
    });

    const pagination: AuditLogPagination = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    };

    return {
      auditLogs: enhancedAuditLogs,
      pagination,
    };
  });
