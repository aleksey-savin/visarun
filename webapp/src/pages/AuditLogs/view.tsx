import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { trpc } from '../../lib/trpcProvider';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RotateCcw, Clock, User, Database, FileText, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { getAllAuditLogsRoute } from '../../lib/routes';

// Define types for the detailed audit log
// This type is now unused as we use the API response directly

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

const getChangeTypeBadge = (changeType: string) => {
  switch (changeType) {
    case 'added':
      return 'bg-green-100 text-green-800';
    case 'removed':
      return 'bg-red-100 text-red-800';
    case 'modified':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

const formatValue = (value: unknown): string => {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'boolean') return value.toString();
  if (typeof value === 'string') return `"${value}"`;
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
};

const ViewAuditLogPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false);
  const [recoveryPreview, setRecoveryPreview] = useState<any>(null);
  const [isRecovering, setIsRecovering] = useState(false);

  const { data, error, isLoading, isError } = trpc.audit.getOne.useQuery(
    { id: id! },
    { enabled: !!id }
  );

  const auditLog = data?.auditLog;

  // Recovery mutation
  const recoverMutation = trpc.audit.recover.useMutation({
    onSuccess: result => {
      if (result.dryRun) {
        setRecoveryPreview(result as any);
        setShowRecoveryDialog(true);
      } else {
        setShowRecoveryDialog(false);
        setRecoveryPreview(null);
        setIsRecovering(false);
        // Show success message or redirect
      }
    },
    onError: error => {
      console.error('Recovery failed:', error);
      setIsRecovering(false);
    },
  });

  const handleRecoveryPreview = () => {
    if (!id) return;

    recoverMutation.mutate({
      auditLogId: id,
      options: {
        dryRun: true,
        generateNewId: false,
      },
    });
  };

  const handleActualRecovery = () => {
    if (!id) return;

    setIsRecovering(true);
    recoverMutation.mutate({
      auditLogId: id,
      options: {
        dryRun: false,
        generateNewId: (recoveryPreview?.conflicts?.length || 0) > 0,
        forceRecover: false,
      },
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (isError || !auditLog) {
    return (
      <div className="container mx-auto py-8">
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <h3 className="font-medium text-lg mb-2">Error Loading Audit Log</h3>
          <p>{error?.message || 'Audit log not found'}</p>
          <Button className="mt-4" onClick={() => navigate(getAllAuditLogsRoute())}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Audit Logs
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate(getAllAuditLogsRoute())}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Audit Logs
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Audit Log Details</h1>
            <p className="text-muted-foreground">View change details and recovery options</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Audit Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Action</label>
                  <div className="mt-1">
                    <Badge className={getActionBadgeColor(auditLog.action)}>
                      {auditLog.action.toUpperCase()}
                    </Badge>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Entity Type</label>
                  <div className="mt-1 flex items-center gap-2">
                    <Database className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{auditLog.entityType}</span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Entity ID</label>
                  <div className="mt-1 font-mono text-sm bg-gray-50 p-2 rounded border text-gray-800">
                    {auditLog.entityId}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Performed At</label>
                  <div className="mt-1 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDateTime(auditLog.performedAt)}</span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Performed By</label>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{auditLog.user?.name || 'System'}</span>
                    {auditLog.user && (
                      <span className="text-sm text-muted-foreground">({auditLog.user.email})</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Changes</label>
                  <div className="mt-1">
                    <span className="font-medium">{auditLog.changeCount}</span>
                    <span className="text-muted-foreground">
                      {' '}
                      field{auditLog.changeCount !== 1 ? 's' : ''} changed
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Summary</label>
                <div className="mt-1 p-3 bg-gray-50 rounded border text-gray-800">
                  {auditLog.changeSummary}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Changes Details */}
          <Card>
            <CardHeader>
              <CardTitle>Field Changes</CardTitle>
            </CardHeader>
            <CardContent>
              {(auditLog.changes || []).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No detailed changes available for this action.
                </div>
              ) : (
                <div className="space-y-4">
                  {(auditLog.changes || []).map((change, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{change.field}</span>
                          <Badge className={getChangeTypeBadge(change.changeType)}>
                            {change.changeType}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {change.changeType !== 'added' && (
                          <div>
                            <label className="text-sm font-medium text-red-600">Old Value</label>
                            <pre className="mt-1 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800 overflow-auto max-h-32">
                              {formatValue(change.oldValue)}
                            </pre>
                          </div>
                        )}

                        {change.changeType !== 'removed' && (
                          <div>
                            <label className="text-sm font-medium text-green-600">New Value</label>
                            <pre className="mt-1 p-3 bg-green-50 border border-green-200 rounded text-sm text-green-800 overflow-auto max-h-32">
                              {formatValue(change.newValue)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Recovery Info */}
          {auditLog.action.toUpperCase() === 'DELETE' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RotateCcw className="h-5 w-5" />
                  Recovery Options
                </CardTitle>
              </CardHeader>
              <CardContent>
                {auditLog.changeCount > 0 ? (
                  <div className="space-y-4">
                    <div className="p-3 bg-green-50 border border-green-200 rounded">
                      <div className="flex items-center gap-2 text-green-800">
                        <div className="h-2 w-2 bg-green-600 rounded-full"></div>
                        <span className="font-medium">Recovery Available</span>
                      </div>
                      <p className="text-sm text-green-700 mt-1">
                        This deleted entity can be recovered with all its original data.
                      </p>
                    </div>
                    <Button
                      onClick={handleRecoveryPreview}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Preview Recovery
                    </Button>
                  </div>
                ) : (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <div className="flex items-center gap-2 text-yellow-800">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="font-medium">Limited Recovery</span>
                    </div>
                    <p className="text-sm text-yellow-700 mt-1">
                      This entity may not have sufficient data for complete recovery.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Raw Data */}
          <Card>
            <CardHeader>
              <CardTitle>Raw Diff Data</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-gray-50 border rounded p-3 overflow-auto max-h-96 text-gray-800">
                {JSON.stringify(auditLog.oldData || auditLog.newData, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recovery Confirmation Dialog */}
      <AlertDialog open={showRecoveryDialog} onOpenChange={setShowRecoveryDialog}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Entity Recovery</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                {recoveryPreview && (
                  <>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>Entity Type:</strong> {recoveryPreview.entityType}
                      </div>
                      <div>
                        <strong>Original ID:</strong> {recoveryPreview.originalId}
                      </div>
                      {recoveryPreview.deletedBy && (
                        <>
                          <div>
                            <strong>Deleted By:</strong> {recoveryPreview.deletedBy.name}
                          </div>
                          <div>
                            <strong>Deleted At:</strong> {formatDateTime(recoveryPreview.deletedAt)}
                          </div>
                        </>
                      )}
                    </div>

                    {recoveryPreview.conflicts?.length > 0 && (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                        <div className="flex items-center gap-2 text-yellow-800 mb-2">
                          <AlertTriangle className="h-4 w-4" />
                          <strong>Conflicts Detected</strong>
                        </div>
                        <ul className="list-disc list-inside space-y-1">
                          {recoveryPreview.conflicts.map((conflict: string, index: number) => (
                            <li key={index} className="text-sm text-yellow-700">
                              {conflict}
                            </li>
                          ))}
                        </ul>
                        <p className="text-sm mt-2 text-yellow-700">
                          <strong>Resolution:</strong> A new ID will be generated to avoid
                          conflicts.
                        </p>
                      </div>
                    )}

                    <div>
                      <strong>Data to be recovered:</strong>
                      <pre className="mt-2 p-3 bg-gray-50 border rounded text-xs overflow-auto max-h-48">
                        {JSON.stringify(recoveryPreview.recoveredData, null, 2)}
                      </pre>
                    </div>

                    <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                      <p className="text-sm text-blue-800">
                        <strong>Note:</strong> This action will create a new entity with the
                        recovered data. The original audit trail will be preserved.
                      </p>
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

export default ViewAuditLogPage;
