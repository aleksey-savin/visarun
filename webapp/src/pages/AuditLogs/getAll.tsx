import { useState, useEffect } from 'react';
import { trpc } from '../../lib/trpcProvider';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Eye, RotateCcw, Clock, User } from 'lucide-react';
import { FilterContainer, FilterFields, FilterField } from '@/components/Filters';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { getViewAuditLogRoute } from '../../lib/routes';

// Define a type for the audit log based on the API response
type AuditLog = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  performedAt: string;
  user: {
    id: string;
    email: string;
    name: string;
  } | null;
  changeSummary: string;
  changeCount: number;
};

// Define a type for the recovery preview response
type RecoveryPreview = {
  entityType: string;
  success: boolean;
  dryRun: boolean;
  recoveredData?: Record<string, unknown>;
  conflicts: string[];
  originalId: string;
  newId?: string;
  useOriginalId: boolean;
  deletedAt: string;
  deletedBy: {
    id: string;
    email: string;
    name: string;
  } | null;
  recoveredAt?: string;
  recoveredEntity?: unknown;
};

// Get action badge color based on action type
const getActionBadgeColor = (action: string) => {
  switch (action.toUpperCase()) {
    case 'CREATE':
      return 'bg-green-100 text-green-800 hover:bg-green-100';
    case 'UPDATE':
      return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
    case 'DELETE':
      return 'bg-red-100 text-red-800 hover:bg-red-100';
    case 'LOGIN':
      return 'bg-purple-100 text-purple-800 hover:bg-purple-100';
    default:
      return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
  }
};

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString();
};

const formatUserName = (user: AuditLog['user']) => {
  if (!user) return 'System';
  return user.name || user.email;
};

const formatEntityType = (entityType: string) => {
  // Convert camelCase or snake_case to human-readable format
  return entityType
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^./, str => str.toUpperCase())
    .trim();
};

const formatChangeSummary = (changeSummary: string, action: string, entityType: string): string => {
  if (!changeSummary || changeSummary === 'No summary available') {
    return '';
  }

  // Try to parse JSON-based change summaries
  try {
    if (changeSummary.includes('{') && changeSummary.includes('}')) {
      const parsed = JSON.parse(changeSummary);

      // Handle "Added items" pattern
      if (changeSummary.startsWith('Added items:') && parsed.to) {
        const items = Array.isArray(parsed.to) ? parsed.to : [parsed.to];
        const count = items.length;

        if (items[0]?.serviceType === 'visa') {
          return `Added ${count} visa service${count !== 1 ? 's' : ''} to order`;
        }
        return `Added ${count} item${count !== 1 ? 's' : ''}`;
      }

      // Handle "Updated fields" pattern
      if (parsed.from && parsed.to) {
        const changes = Object.keys(parsed.to).length;
        return `Updated ${changes} field${changes !== 1 ? 's' : ''}`;
      }

      // Handle "Removed items" pattern
      if (changeSummary.startsWith('Removed items:') && parsed.from) {
        const items = Array.isArray(parsed.from) ? parsed.from : [parsed.from];
        const count = items.length;
        return `Removed ${count} item${count !== 1 ? 's' : ''}`;
      }
    }
  } catch {
    // If JSON parsing fails, continue with text-based parsing
  }

  // Handle common text patterns
  if (changeSummary.includes('email')) {
    return 'Updated email address';
  }
  if (changeSummary.includes('password')) {
    return 'Changed password';
  }
  if (changeSummary.includes('name')) {
    return 'Updated name';
  }
  if (changeSummary.includes('phone')) {
    return 'Updated phone number';
  }
  if (changeSummary.includes('status')) {
    return 'Changed status';
  }

  // For very long summaries, provide a generic description
  if (changeSummary.length > 100) {
    const actionLower = action.toLowerCase();
    const entity = formatEntityType(entityType).toLowerCase();

    switch (actionLower) {
      case 'create':
        return `Created new ${entity} with initial data`;
      case 'update':
        return `Made changes to ${entity}`;
      case 'delete':
        return `Removed ${entity}`;
      default:
        return `Performed ${actionLower} on ${entity}`;
    }
  }

  // Return the original if it's short and readable
  return changeSummary;
};

const formatActionDescription = (action: string, entityType: string) => {
  const formattedEntity = formatEntityType(entityType);
  const actionLower = action.toLowerCase();

  switch (actionLower) {
    case 'create':
      return `Created a new ${formattedEntity}`;
    case 'update':
      return `Modified ${formattedEntity}`;
    case 'delete':
      return `Deleted ${formattedEntity}`;
    case 'login':
      return 'User logged in';
    default:
      return `${action} action on ${formattedEntity}`;
  }
};

const AllAuditLogsPage = () => {
  const navigate = useNavigate();
  const [selectedEntityType, setSelectedEntityType] = useState('all');
  const [selectedAction, setSelectedAction] = useState('all');
  const [selectedUser, setSelectedUser] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [recoverLogId, setRecoverLogId] = useState<string | null>(null);
  const [recoveryPreview, setRecoveryPreview] = useState<RecoveryPreview | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  const [isRecovering, setIsRecovering] = useState(false);

  // Get filter options
  const {
    data: filterOptions,
    isLoading: filtersLoading,
    error: filtersError,
  } = trpc.audit.getFilterOptions.useQuery();

  // Get audit logs with filters
  const { data, error, isLoading, isError, refetch } = trpc.audit.getAll.useQuery({
    page,
    limit,
    entityType: selectedEntityType === 'all' ? undefined : selectedEntityType,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    action: selectedAction === 'all' ? undefined : (selectedAction as any),
    userId: selectedUser === 'all' ? undefined : selectedUser,
    startDate: startDate ? new Date(startDate).toISOString() : undefined,
    endDate: endDate ? new Date(endDate).toISOString() : undefined,
  });

  // Recovery mutation (dry run first)
  const recoverMutation = trpc.audit.recover.useMutation({
    onSuccess: result => {
      if (result.dryRun) {
        setRecoveryPreview(result as unknown as RecoveryPreview);
      } else {
        refetch();
        setRecoverLogId(null);
        setRecoveryPreview(null);
        setIsRecovering(false);
      }
    },
    onError: error => {
      console.error('Recovery failed:', error);
      setIsRecovering(false);
    },
  });

  const handleRecoveryPreview = (logId: string) => {
    setRecoverLogId(logId);
    recoverMutation.mutate({
      auditLogId: logId,
      options: {
        dryRun: true,
        generateNewId: false,
      },
    });
  };

  const handleActualRecovery = () => {
    if (!recoverLogId) return;

    setIsRecovering(true);
    recoverMutation.mutate({
      auditLogId: recoverLogId,
      options: {
        dryRun: false,
        generateNewId: (recoveryPreview?.conflicts.length || 0) > 0,
        forceRecover: false,
      },
    });
  };

  const auditLogs = data?.auditLogs || [];
  const totalPages = data?.pagination?.totalPages || 0;

  const resetFilters = () => {
    setSelectedEntityType('all');
    setSelectedAction('all');
    setSelectedUser('all');
    setStartDate('');
    setEndDate('');
    setPage(1);
    setLimit(20);
  };

  return (
    <div className="grid gap-6 p-6 pb-0">
      <FilterContainer onClearFilters={resetFilters}>
        <FilterFields>
          <FilterField label="Start Date">
            <Input
              type="datetime-local"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
            />
          </FilterField>

          <FilterField label="End Date">
            <Input
              type="datetime-local"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
            />
          </FilterField>
          <FilterField label="Entity Type">
            <Select
              value={selectedEntityType}
              onValueChange={setSelectedEntityType}
              disabled={filtersLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder={filtersLoading ? 'Loading...' : 'All entity types'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All entity types</SelectItem>
                {(filterOptions?.entityTypes || []).map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterField>
          <FilterField label="Action">
            <Select
              value={selectedAction}
              onValueChange={setSelectedAction}
              disabled={filtersLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder={filtersLoading ? 'Loading...' : 'All actions'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All actions</SelectItem>
                {(filterOptions?.actions || []).map(action => (
                  <SelectItem key={action.value} value={action.value}>
                    {action.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterField>
          <FilterField label="User">
            <Select value={selectedUser} onValueChange={setSelectedUser} disabled={filtersLoading}>
              <SelectTrigger>
                <SelectValue placeholder={filtersLoading ? 'Loading...' : 'All users'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All users</SelectItem>
                {(filterOptions?.users || []).map(user => (
                  <SelectItem key={user.value} value={user.value}>
                    {user.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterField>
        </FilterFields>

        <div className="text-sm text-muted-foreground mt-4">
          {filtersLoading && 'Loading filters...'}
          {filtersError && (
            <div className="text-red-600">
              Filter error: {filtersError.message}
              <br />
              <details className="text-xs mt-1">
                <summary>Error details</summary>
                <pre className="whitespace-pre-wrap">{JSON.stringify(filtersError, null, 2)}</pre>
              </details>
            </div>
          )}
        </div>
      </FilterContainer>

      {isLoading && (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      )}

      {isError && (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <h3 className="font-medium text-lg mb-2">Error Loading Audit Logs</h3>
          <p>{error.message}</p>
        </div>
      )}

      {auditLogs.length === 0 && !isLoading && !isError ? (
        <div className="text-center py-8 text-muted-foreground">
          No audit logs found matching your criteria.
        </div>
      ) : (
        <>
          {/* Table view (hidden on mobile) */}
          <div className="hidden lg:block">
            <div className="overflow-x-auto rounded-md border border-muted">
              <Table className="text-gray-400">
                <TableHeader>
                  <TableRow className="bg-muted hover:bg-gray-800/50">
                    <TableHead>Action</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>When</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log: AuditLog) => (
                    <TableRow key={log.id} className="hover:bg-muted/50">
                      <TableCell>
                        <Badge className={getActionBadgeColor(log.action)}>
                          {log.action.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {formatActionDescription(log.action, log.entityType)}
                          </div>
                          {formatChangeSummary(log.changeSummary, log.action, log.entityType) && (
                            <div className="text-sm text-muted-foreground mt-1">
                              {formatChangeSummary(log.changeSummary, log.action, log.entityType)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{formatUserName(log.user)}</span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{formatDateTime(log.performedAt)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-white">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(getViewAuditLogRoute({ id: log.id }))}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {log.action.toUpperCase() === 'DELETE' && log.changeCount > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRecoveryPreview(log.id)}
                              title="Recover deleted entity"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
            {auditLogs.map((log: AuditLog) => (
              <Card key={log.id} className="border border-muted">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">
                      <div className="flex items-center gap-2">
                        <Badge className={getActionBadgeColor(log.action)}>
                          {log.action.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="mt-2 text-sm font-normal text-muted-foreground">
                        {formatActionDescription(log.action, log.entityType)}
                      </div>
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Performed by:</span>
                      <span className="text-sm font-medium">{formatUserName(log.user)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">When:</span>
                      <span className="text-sm">{formatDateTime(log.performedAt)}</span>
                    </div>
                    {log.changeCount > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Changes made:</span>
                        <span className="text-sm">
                          {log.changeCount} field{log.changeCount !== 1 ? 's' : ''} modified
                        </span>
                      </div>
                    )}
                    {formatChangeSummary(log.changeSummary, log.action, log.entityType) && (
                      <div className="flex flex-col gap-1 pt-2 border-t">
                        <span className="text-sm text-muted-foreground">Details:</span>
                        <span className="text-sm">
                          {formatChangeSummary(log.changeSummary, log.action, log.entityType)}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(getViewAuditLogRoute({ id: log.id }))}
                        className="flex items-center gap-1"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                      {log.action.toUpperCase() === 'DELETE' && log.changeCount > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRecoveryPreview(log.id)}
                          className="flex items-center gap-1"
                        >
                          <RotateCcw className="h-4 w-4" />
                          Recover
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="space-y-4 mt-6 p-4 border-t">
              <div className="text-sm text-muted-foreground text-center">
                Showing {(page - 1) * limit + 1} to{' '}
                {Math.min(page * limit, data?.pagination?.total || 0)} of{' '}
                {data?.pagination?.total || 0} entries
              </div>

              {/* Navigation Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPage(1)}
                    disabled={page === 1}
                    className={isMobile ? 'text-xs px-2' : ''}
                  >
                    {isMobile ? '<<' : 'First'}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className={isMobile ? 'text-xs px-2' : ''}
                  >
                    {isMobile ? '<' : 'Previous'}
                  </Button>

                  <div className="flex items-center gap-1">
                    {/* Show page numbers */}
                    {Array.from({ length: Math.min(isMobile ? 3 : 5, totalPages) }, (_, i) => {
                      const maxPages = isMobile ? 3 : 5;
                      let pageNum;
                      if (totalPages <= maxPages) {
                        pageNum = i + 1;
                      } else if (page <= Math.ceil(maxPages / 2)) {
                        pageNum = i + 1;
                      } else if (page >= totalPages - Math.floor(maxPages / 2)) {
                        pageNum = totalPages - maxPages + 1 + i;
                      } else {
                        pageNum = page - Math.floor(maxPages / 2) + i;
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={page === pageNum ? 'default' : 'secondary'}
                          size="sm"
                          onClick={() => setPage(pageNum)}
                          className={isMobile ? 'w-7 h-7 p-0 text-xs' : 'w-8 h-8 p-0'}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className={isMobile ? 'text-xs px-2' : ''}
                  >
                    {isMobile ? '>' : 'Next'}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPage(totalPages)}
                    disabled={page === totalPages}
                    className={isMobile ? 'text-xs px-2' : ''}
                  >
                    {isMobile ? '>>' : 'Last'}
                  </Button>
                </div>
              </div>

              {/* Page Controls - Hidden on mobile, stacked on small screens */}
              <div className="hidden sm:flex flex-col lg:flex-row items-center justify-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Go to page:</span>
                  <Input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={page.toString()}
                    onChange={e => {
                      const newPage = parseInt(e.target.value);
                      if (newPage >= 1 && newPage <= totalPages) {
                        setPage(newPage);
                      }
                    }}
                    className="w-16 h-8"
                  />
                  <span className="text-sm text-muted-foreground">of {totalPages}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Items per page:</span>
                  <Select
                    value={limit.toString()}
                    onValueChange={value => {
                      const newLimit = parseInt(value);
                      setLimit(newLimit);
                      const maxPage = Math.ceil((data?.pagination?.total || 0) / newLimit);
                      setPage(Math.min(page, maxPage));
                    }}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Recovery Confirmation Dialog */}
      <AlertDialog
        open={!!recoveryPreview}
        onOpenChange={() => {
          setRecoverLogId(null);
          setRecoveryPreview(null);
        }}
      >
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Recover Deleted Entity</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                {recoveryPreview && (
                  <>
                    <div>
                      <strong>Item Type:</strong> {formatEntityType(recoveryPreview.entityType)}
                    </div>
                    {recoveryPreview.deletedBy && (
                      <div>
                        <strong>Deleted By:</strong> {recoveryPreview.deletedBy.name} (
                        {recoveryPreview.deletedBy.email})
                      </div>
                    )}
                    <div>
                      <strong>Deleted At:</strong> {formatDateTime(recoveryPreview.deletedAt)}
                    </div>

                    {recoveryPreview.conflicts.length > 0 && (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                        <strong>Conflicts:</strong>
                        <ul className="list-disc list-inside mt-1">
                          {recoveryPreview.conflicts.map((conflict: string, index: number) => (
                            <li key={index} className="text-sm">
                              {conflict}
                            </li>
                          ))}
                        </ul>
                        <p className="text-sm mt-2">
                          A new ID will be generated to avoid conflicts.
                        </p>
                      </div>
                    )}

                    <div>
                      <strong>What will be recovered:</strong>
                      <div className="mt-2 p-3 bg-gray-50 border rounded text-sm">
                        This will restore the deleted{' '}
                        {formatEntityType(recoveryPreview.entityType).toLowerCase()} with all its
                        original data and settings.
                      </div>
                    </div>
                  </>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleActualRecovery}
              disabled={isRecovering}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              {isRecovering ? 'Recovering...' : 'Recover Entity'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AllAuditLogsPage;
