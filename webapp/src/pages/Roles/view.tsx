import { useParams, useNavigate } from 'react-router-dom';
import { getAllRolesRoute, getEditRoleRoute, ViewRoleRouteParams } from '../../lib/routes';
import { trpc } from '../../lib/trpcProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Shield,
  Users,
  Lock,
  CheckCircle,
  AlertCircle,
  Settings,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Permission {
  id: string;
  code: string;
  description: string | null;
  category: string | null;
}

interface RoleResponse {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions: Permission[];
  permissionIds: string[];
}

const ViewRolePage = () => {
  const { id } = useParams() as ViewRoleRouteParams;
  const navigate = useNavigate();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { data, error, isLoading, isError } = trpc.role.getOne.useQuery(
    { id },
    {
      retry: 1,
    }
  );

  const roleData = data?.role as RoleResponse | undefined;

  const deleteRoleMutation = trpc.role.delete.useMutation({
    onSuccess: () => {
      toast.success('Role deleted successfully', {
        description: 'The role has been permanently removed.',
      });
      navigate(getAllRolesRoute());
    },
    onError: error => {
      toast.error('Failed to delete role', {
        description: error.message,
      });
    },
  });

  const handleDeleteRole = () => {
    deleteRoleMutation.mutate({ id });
    setIsDeleteDialogOpen(false);
  };

  const getRoleBadgeVariant = (roleName: string) => {
    switch (roleName.toLowerCase()) {
      case 'admin':
        return 'destructive';
      case 'manager':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const groupPermissionsByCategory = (permissions: Permission[]) => {
    return permissions.reduce(
      (acc, permission) => {
        const category = permission.category || 'General';
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(permission);
        return acc;
      },
      {} as Record<string, Permission[]>
    );
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center gap-4 mb-8">
          <Skeleton className="h-10 w-10 rounded-md" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-7 w-40" />
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Separator />
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-20" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (isError || !roleData) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" size="icon" onClick={() => navigate(getAllRolesRoute())}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Role Details</h1>
            <p className="text-muted-foreground">View and manage role information</p>
          </div>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error?.message || `Role with ID ${id} could not be found.`}
          </AlertDescription>
        </Alert>

        <div className="mt-6">
          <Button variant="outline" onClick={() => navigate(getAllRolesRoute())}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Roles
          </Button>
        </div>
      </div>
    );
  }

  const groupedPermissions = groupPermissionsByCategory(roleData.permissions);

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" size="icon" onClick={() => navigate(getAllRolesRoute())}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Role Details</h1>
          <p className="text-muted-foreground">View and manage role information</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={getRoleBadgeVariant(roleData.name)} className="h-6">
            <Shield className="h-3 w-3 mr-1" />
            {roleData.name.charAt(0).toUpperCase() + roleData.name.slice(1)}
          </Badge>
          {roleData.isSystem && (
            <Badge variant="outline" className="h-6">
              <Lock className="h-3 w-3 mr-1" />
              System Role
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Role Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Role Information
              </CardTitle>
              <CardDescription>Basic details about this role and its configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Role Name</label>
                  <p className="text-lg font-semibold">{roleData.name}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Type</label>
                  <div className="flex items-center gap-2">
                    {roleData.isSystem ? (
                      <>
                        <Lock className="h-4 w-4 text-amber-600" />
                        <span className="text-amber-600 font-medium">System Role</span>
                      </>
                    ) : (
                      <>
                        <Users className="h-4 w-4 text-green-600" />
                        <span className="text-green-600 font-medium">Custom Role</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {roleData.description && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <p className="text-sm bg-muted p-3 rounded-lg">{roleData.description}</p>
                </div>
              )}

              <Separator />

              {/* Permissions Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Permissions ({roleData.permissions.length})
                  </h3>
                  {roleData.permissions.length === 0 && (
                    <Badge variant="outline" className="text-amber-600 border-amber-200">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      No permissions
                    </Badge>
                  )}
                </div>

                {roleData.permissions.length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(groupedPermissions).map(([category, permissions]) => (
                      <div key={category} className="space-y-2">
                        <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                          {category}
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {permissions.map(permission => (
                            <div
                              key={permission.id}
                              className="flex items-center gap-2 p-2 bg-muted/50 rounded-md border"
                            >
                              <CheckCircle className="h-3 w-3 text-green-600 flex-shrink-0" />
                              <span className="text-sm font-mono">{permission.code}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No permissions assigned to this role</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Users with this role will have no special permissions
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="default"
                className="w-full justify-start"
                onClick={() => navigate(getEditRoleRoute({ id: roleData.id }))}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Role
              </Button>

              {!roleData.isSystem ? (
                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      className="w-full justify-start"
                      disabled={deleteRoleMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {deleteRoleMutation.isPending ? 'Deleting...' : 'Delete Role'}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Role</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete the role "{roleData.name}"? This action
                        cannot be undone and may affect users who are assigned this role.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <Button variant="destructive" onClick={handleDeleteRole}>
                        Delete Role
                      </Button>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : (
                <Alert>
                  <Lock className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    System roles cannot be deleted as they are required for the application to
                    function properly.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Statistics Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Permissions</span>
                <Badge variant="secondary">{roleData.permissions.length}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Permission Categories</span>
                <Badge variant="secondary">{Object.keys(groupedPermissions).length}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Role Type</span>
                <Badge variant={roleData.isSystem ? 'outline' : 'default'}>
                  {roleData.isSystem ? 'System' : 'Custom'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ViewRolePage;
