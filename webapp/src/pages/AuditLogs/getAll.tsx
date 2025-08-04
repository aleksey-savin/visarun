import { useState } from 'react';
import { trpc } from '../../lib/trpcProvider';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Filter, Eye, RotateCcw, Clock, User, Database } from 'lucide-react';
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [recoveryPreview, setRecoveryPreview] = useState<Record<string, any> | null>(null);
  const [isRecovering, setIsRecovering] = useState(false);

  // Get filter options
  const {
    data: filterOptions,
    isLoading: filtersLoading,
    error: filtersError,
  } = trpc.audit.getFilterOptions.useQuery();

  // Debug logging
  if (filterOptions) {
    console.log('🎯 Filter options loaded:', filterOptions);
  }
  if (filtersError) {
    console.error('❌ Filter options error:', filtersError);
  }

  // Get audit logs with filters
  const { data, error, isLoading, isError, refetch } = trpc.audit.getAll.useQuery({
    page,
    limit,
    entityType: selectedEntityType === 'all' ? undefined : selectedEntityType,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    action: selectedAction === 'all' ? undefined : (selectedAction as any),
    userId: selectedUser === 'all' ? undefined : selectedUser,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  // Recovery mutation (dry run first)
  const recoverMutation = trpc.audit.recover.useMutation({
    onSuccess: result => {
      if (result.dryRun) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setRecoveryPreview(result as any);
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
        generateNewId: (recoveryPreview?.conflicts?.length || 0) > 0,
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
    <div className="grid gap-6 p-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <Input
                type="datetime-local"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">End Date</label>
              <Input
                type="datetime-local"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Entity Type</label>
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
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Action</label>
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
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">User</label>
              <Select
                value={selectedUser}
                onValueChange={setSelectedUser}
                disabled={filtersLoading}
              >
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
            </div>
          </div>

          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-muted-foreground">
              {filtersLoading && 'Loading filters...'}
              {filtersError && (
                <div className="text-red-600">
                  Filter error: {filtersError.message}
                  <br />
                  <details className="text-xs mt-1">
                    <summary>Error details</summary>
                    <pre className="whitespace-pre-wrap">
                      {JSON.stringify(filtersError, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
              {filterOptions &&
                !filtersLoading &&
                !filtersError &&
                `${filterOptions.entityTypes?.length || 0} entity types, ${filterOptions.users?.length || 0} users`}
            </div>
            <Button variant="outline" onClick={resetFilters}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Audit Logs ({data?.pagination?.total || 0})</CardTitle>
            <div className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </div>
          </div>
        </CardHeader>
        <CardContent>
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
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Action</TableHead>
                        <TableHead>Entity</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Performed At</TableHead>
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
                              <div className="font-medium">{log.entityType}</div>
                              <div className="text-sm text-muted-foreground">{log.entityId}</div>
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
                          <TableCell className="text-right">
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

              {/* Card view (visible on mobile) */}
              <div className="grid grid-cols-1 gap-4 lg:hidden">
                {auditLogs.map((log: AuditLog) => (
                  <Card key={log.id} className="hover:border-primary/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <Badge className={getActionBadgeColor(log.action)}>
                            {log.action.toUpperCase()}
                          </Badge>
                          <div className="flex items-center gap-1">
                            <Database className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{log.entityType}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
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
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{formatUserName(log.user)}</span>
                        </div>
                        <div className="text-muted-foreground">Entity ID: {log.entityId}</div>
                        <div className="text-muted-foreground">
                          {log.changeSummary} • {log.changeCount} change
                          {log.changeCount !== 1 ? 's' : ''}
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{formatDateTime(log.performedAt)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 p-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Showing {(page - 1) * limit + 1} to{' '}
                    {Math.min(page * limit, data?.pagination?.total || 0)} of{' '}
                    {data?.pagination?.total || 0} entries
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(1)}
                      disabled={page === 1}
                    >
                      First
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>

                    <div className="flex items-center gap-1">
                      {/* Show page numbers */}
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (page <= 3) {
                          pageNum = i + 1;
                        } else if (page >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = page - 2 + i;
                        }

                        return (
                          <Button
                            key={pageNum}
                            variant={page === pageNum ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setPage(pageNum)}
                            className="w-8 h-8 p-0"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}

                      {totalPages > 5 && page < totalPages - 2 && (
                        <>
                          <span className="px-2 text-muted-foreground">...</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(totalPages)}
                            className="w-8 h-8 p-0"
                          >
                            {totalPages}
                          </Button>
                        </>
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Next
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(totalPages)}
                      disabled={page === totalPages}
                    >
                      Last
                    </Button>
                  </div>

                  <div className="flex items-center gap-4">
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
        </CardContent>
      </Card>

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
                      <strong>Entity Type:</strong> {recoveryPreview.entityType}
                    </div>
                    <div>
                      <strong>Original ID:</strong> {recoveryPreview.originalId}
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

                    {recoveryPreview.conflicts?.length > 0 && (
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
                      <strong>Recoverable Data:</strong>
                      <pre className="mt-2 p-3 bg-gray-50 border rounded text-xs overflow-auto max-h-40">
                        {JSON.stringify(recoveryPreview.recoveredData, null, 2)}
                      </pre>
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
