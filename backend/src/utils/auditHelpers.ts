import { type JsonValue } from '@prisma/client/runtime/library';
import { type ChangeAnalysis } from '../types/audit.js';

// Analyze changes from the new diff-only format
export function analyzeChanges(
  oldData: JsonValue | null,
  newData: JsonValue | null
): ChangeAnalysis[] {
  const changes: ChangeAnalysis[] = [];

  // Handle the new diff-only format where data contains { field: { from: oldValue, to: newValue } }
  if (newData && typeof newData === 'object' && !Array.isArray(newData)) {
    const diffData = newData as Record<string, { from: unknown; to: unknown }>;

    // Check if this is the new diff format
    const isNewDiffFormat = Object.values(diffData).some(
      value => value && typeof value === 'object' && 'from' in value && 'to' in value
    );

    if (isNewDiffFormat) {
      // New diff-only format
      Object.entries(diffData).forEach(([field, change]) => {
        if (change && typeof change === 'object' && 'from' in change && 'to' in change) {
          let changeType: 'added' | 'modified' | 'removed';

          if (change.from === null || change.from === undefined) {
            changeType = 'added';
          } else if (change.to === null || change.to === undefined) {
            changeType = 'removed';
          } else {
            changeType = 'modified';
          }

          changes.push({
            field,
            oldValue: change.from,
            newValue: change.to,
            changeType,
          });
        }
      });
      return changes;
    }
  }

  // Fallback to legacy format for backward compatibility
  if (!oldData && !newData) {
    return changes;
  }

  // Convert to objects for comparison
  const oldObj = oldData as Record<string, unknown> | null;
  const newObj = newData as Record<string, unknown> | null;

  if (!oldObj && newObj) {
    // New record created
    Object.keys(newObj).forEach(field => {
      if (field !== 'createdAt' && field !== 'updatedAt') {
        changes.push({
          field,
          oldValue: null,
          newValue: newObj[field],
          changeType: 'added',
        });
      }
    });
  } else if (oldObj && !newObj) {
    // Record deleted
    Object.keys(oldObj).forEach(field => {
      if (field !== 'createdAt' && field !== 'updatedAt') {
        changes.push({
          field,
          oldValue: oldObj[field],
          newValue: null,
          changeType: 'removed',
        });
      }
    });
  } else if (oldObj && newObj) {
    // Record updated - find differences
    const allFields = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);

    allFields.forEach(field => {
      // Skip timestamp fields
      if (field === 'createdAt' || field === 'updatedAt') {
        return;
      }

      const oldValue = oldObj[field];
      const newValue = newObj[field];

      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        let changeType: 'added' | 'modified' | 'removed';

        if (oldValue === undefined || oldValue === null) {
          changeType = 'added';
        } else if (newValue === undefined || newValue === null) {
          changeType = 'removed';
        } else {
          changeType = 'modified';
        }

        changes.push({
          field,
          oldValue,
          newValue,
          changeType,
        });
      }
    });
  }

  return changes;
}

// Format a change description for human reading
export function formatChangeDescription(change: ChangeAnalysis): string {
  switch (change.changeType) {
    case 'added':
      return `Added ${change.field}: ${formatValue(change.newValue)}`;
    case 'removed':
      return `Removed ${change.field}: ${formatValue(change.oldValue)}`;
    case 'modified':
      return `Changed ${change.field} from ${formatValue(change.oldValue)} to ${formatValue(change.newValue)}`;
  }
}

// Format a value for display
function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return 'null';
  }

  if (typeof value === 'string') {
    return `"${value}"`;
  }

  if (typeof value === 'object') {
    if (Array.isArray(value)) {
      return `[${value.length} items]`;
    }
    return JSON.stringify(value);
  }

  return String(value);
}

// Extract old and new data from diff-only format for display purposes
export function extractOldNewData(diffData: JsonValue | null): {
  oldData: Record<string, unknown> | null;
  newData: Record<string, unknown> | null;
} {
  if (!diffData || typeof diffData !== 'object' || Array.isArray(diffData)) {
    return { oldData: null, newData: null };
  }

  const diff = diffData as Record<string, { from: unknown; to: unknown }>;

  // Check if this is the new diff format
  const isNewDiffFormat = Object.values(diff).some(
    value => value && typeof value === 'object' && 'from' in value && 'to' in value
  );

  if (!isNewDiffFormat) {
    // Legacy format - assume it's already old/new data structure
    const legacyDiff = diff as { oldData?: unknown; newData?: unknown };
    return {
      oldData: (legacyDiff.oldData as Record<string, unknown>) || null,
      newData: (legacyDiff.newData as Record<string, unknown>) || null,
    };
  }

  // New diff-only format - reconstruct old and new data
  const oldData: Record<string, unknown> = {};
  const newData: Record<string, unknown> = {};
  let hasOldData = false;
  let hasNewData = false;

  Object.entries(diff).forEach(([field, change]) => {
    if (change && typeof change === 'object' && 'from' in change && 'to' in change) {
      if (change.from !== null && change.from !== undefined) {
        oldData[field] = change.from;
        hasOldData = true;
      }
      if (change.to !== null && change.to !== undefined) {
        newData[field] = change.to;
        hasNewData = true;
      }
    }
  });

  return {
    oldData: hasOldData ? oldData : null,
    newData: hasNewData ? newData : null,
  };
}

// Get a summary of changes for an audit log entry
export function getChangeSummary(oldData: JsonValue | null, newData: JsonValue | null): string {
  const changes = analyzeChanges(oldData, newData);

  if (changes.length === 0) {
    return 'No changes detected';
  }

  if (changes.length === 1) {
    return formatChangeDescription(changes[0]);
  }

  const addedCount = changes.filter(c => c.changeType === 'added').length;
  const modifiedCount = changes.filter(c => c.changeType === 'modified').length;
  const removedCount = changes.filter(c => c.changeType === 'removed').length;

  const parts: string[] = [];
  if (addedCount > 0) parts.push(`${addedCount} added`);
  if (modifiedCount > 0) parts.push(`${modifiedCount} modified`);
  if (removedCount > 0) parts.push(`${removedCount} removed`);

  return `${changes.length} changes: ${parts.join(', ')}`;
}

// Filter sensitive fields from audit data
export function sanitizeAuditData(
  data: unknown,
  sensitiveFields: string[] = ['password', 'token', 'secret']
): unknown {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sanitized = { ...data } as Record<string, unknown>;

  sensitiveFields.forEach(field => {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  });

  return sanitized;
}

// Get entity display name for UI
export function getEntityDisplayName(
  entityType: string,
  entityData: Record<string, unknown> | null
): string {
  if (!entityData) {
    return entityType;
  }

  // Try common display fields
  const displayFields = ['name', 'title', 'email', 'firstName', 'description'];

  for (const field of displayFields) {
    if (entityData[field]) {
      return `${entityType}: ${entityData[field]}`;
    }
  }

  // For users, combine first and last name
  if (entityType === 'User' && entityData.firstName) {
    const fullName = `${entityData.firstName} ${entityData.lastName || ''}`.trim();
    return `${entityType}: ${fullName}`;
  }

  // Fallback to ID if available
  if (entityData.id) {
    return `${entityType}: ${entityData.id}`;
  }

  return entityType;
}

// Determine if an audit entry represents a significant change
export function isSignificantChange(action: string, changes: ChangeAnalysis[]): boolean {
  // All creates and deletes are significant
  if (action === 'CREATE' || action === 'DELETE') {
    return true;
  }

  // Login events are always significant
  if (action === 'LOGIN') {
    return true;
  }

  // For updates, check if any non-trivial fields changed
  const significantFields = changes.filter(change => {
    // Ignore purely cosmetic or system fields
    const trivialFields = ['updatedAt', 'lastModified', 'version'];
    return !trivialFields.includes(change.field);
  });

  return significantFields.length > 0;
}
