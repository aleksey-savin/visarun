// Audit system types
export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
}

// Types for audit operations
export interface AuditContext {
  user?: {
    id: string;
    email: string;
    roles: string[];
    permissions: string[];
  };
  action: AuditAction;
  entityType: string;
  entityId?: string;
  oldData: Record<string, unknown> | null;
  newData: Record<string, unknown> | null;
}

// Type for audit log entries returned from database
export interface AuditLogEntry {
  id: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  userId: string;
  performedAt: Date;
  diff: {
    oldData: unknown;
    newData: unknown;
  };
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  } | null;
}

// Type for change analysis
export interface ChangeAnalysis {
  field: string;
  oldValue: unknown;
  newValue: unknown;
  changeType: 'added' | 'modified' | 'removed';
}

// Enhanced audit log with analysis
export interface EnhancedAuditLog {
  id: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  userId: string;
  performedAt: Date;
  changeSummary: string;
  changeCount: number;
  entityDisplayName: string;
  changes?: ChangeAnalysis[];
  oldData: unknown;
  newData: unknown;
  user: {
    id: string;
    email: string;
    name: string;
  } | null;
}

// Pagination type for audit log queries
export interface AuditLogPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Audit log query filters
export interface AuditLogFilters {
  page?: number;
  limit?: number;
  entityType?: string;
  action?: AuditAction;
  userId?: string;
  entityId?: string;
  startDate?: string;
  endDate?: string;
}
