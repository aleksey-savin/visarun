import { useState } from 'react';
import { trpc } from '../../lib/trpcProvider';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Search, Filter, Eye, RotateCcw, Clock, User, Database } from 'lucide-react';
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
  const [entityIdSearch, setEntityIdSearch] = useState('');
  const [selectedEntityType, setSelectedEntityType] = useState('all');
  const [selectedAction, setSelectedAction] = useState('all');
  const [selectedUser, setSelectedUser] = useState('all');
  const [page, setPage] = useState(1);
  const [recoverLogId, setRecoverLogId] = useState<string | null>(null);
  const [recoveryPreview, setRecoveryPreview] = useState<any>(null);
  const [isRecovering, setIsRecovering] = useState(false);

  const limit = 20;

  // Get filter options
  const { data: filterOptions } = trpc.audit.getFilterOptions.useQuery();

  // Get audit logs with filters
  const { data, error, isLoading, isError, refetch } = trpc.audit.getAll.useQuery({
    page,
    limit,
    entityType: selectedEntityType === 'all' ? undefined : selectedEntityType,
    action: selectedAction === 'all' ? undefined : (selectedAction as any),
    userId: selectedUser === 'all' ? undefined : selectedUser,
    entityId: entityIdSearch || undefined,
  });

  // Recovery mutation (dry run first)
  const recoverMutation = trpc.audit.recover.useMutation({
    onSuccess: result => {
      if (result.dryRun) {
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
    setEntityIdSearch('');
    setSelectedEntityType('all');
    setSelectedAction('all');
    setSelectedUser('all');
    setPage(1);
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Audit Logs</h1>
          <p className="text-muted-foreground">Track and manage system changes</p>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Entity ID</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by entity ID..."
                  value={entityIdSearch}
                  onChange={e => setEntityIdSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Entity Type</label>
              <Select value={selectedEntityType} onValueChange={setSelectedEntityType}>
                <SelectTrigger>
                  <SelectValue placeholder="All entity types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All entity types</SelectItem>
                  {filterOptions?.entityTypes?.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Action</label>
              <Select value={selectedAction} onValueChange={setSelectedAction}>
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All actions</SelectItem>
                  {filterOptions?.actions?.map(action => (
                    <SelectItem key={action.value} value={action.value}>
                      {action.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">User</label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="All users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All users</SelectItem>
                  {filterOptions?.users?.map(user => (
                    <SelectItem key={user.value} value={user.value}>
                      {user.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end mt-4">
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
                        <TableHead>Changes</TableHead>
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
                            <div>
                              <div className="text-sm">{log.changeSummary}</div>
                              <div className="text-xs text-muted-foreground">
                                {log.changeCount} field{log.changeCount !== 1 ? 's' : ''} changed
                              </div>
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
                <div className="flex justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <span className="py-2 px-4 text-sm">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
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
