import { useParams, useNavigate } from 'react-router-dom';
import { getAllRolesRoute, getEditRoleRoute, ViewRoleRouteParams } from '../../lib/routes';
import { trpc } from '../../lib/trpcProvider';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
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

// Use the ViewRoleRouteParams type from routes.ts

// Define interfaces for role and permission data
interface Permission {
  id: string;
  code: string;
  description: string | null;
  category: string | null;
}

// Interface for role data returned by the API
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

  // Query to get role details using the getOne endpoint
  const { data, error, isLoading, isError } = trpc.role.getOne.useQuery(
    { id },
    {
      retry: 1,
    }
  );

  // Get the role data from the response
  const roleData = data?.role as RoleResponse | undefined;

  // Mutation to delete role
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

  // Function to handle role deletion
  const handleDeleteRole = () => {
    deleteRoleMutation.mutate({ id });
    setIsDeleteDialogOpen(false);
  };

  // Commented out for now until we have timestamp data
  /*
  const formatDate = (date: string | Date) => {
    return format(new Date(date), 'PPP');
  };
  */

  // Get role badge color based on role
  const getRoleBadgeColor = (roleName: string) => {
    switch (roleName.toLowerCase()) {
      case 'admin':
        return 'bg-red-100 text-red-800 hover:bg-red-100';
      case 'manager':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
      default:
        return 'bg-green-100 text-green-800 hover:bg-green-100';
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(getAllRolesRoute())}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Role Details</h1>
        </div>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-4">
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-4 w-1/4 mt-2" />
              </CardHeader>
              <CardContent className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
          <div>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {isError && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700">Error Loading Role</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error.message}</p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={() => navigate(getAllRolesRoute())}>
              Back to All Roles
            </Button>
          </CardFooter>
        </Card>
      )}

      {!isLoading && !isError && !roleData && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-amber-700">Role Not Found</CardTitle>
            <CardDescription>The role with ID {id} could not be found.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button variant="outline" onClick={() => navigate(getAllRolesRoute())}>
              Back to All Roles
            </Button>
          </CardFooter>
        </Card>
      )}

      {roleData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Role Information */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl capitalize">{roleData.name}</CardTitle>
                </div>
                <div className="py-3 flex gap-2">
                  <Badge className={getRoleBadgeColor(roleData.name)}>
                    {roleData.name.charAt(0).toUpperCase() + roleData.name.slice(1)}
                  </Badge>
                  {roleData.isSystem && (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      System Role
                    </Badge>
                  )}
                </div>

                {roleData.description && <CardDescription>{roleData.description}</CardDescription>}
              </CardHeader>

              <CardContent className="pt-4 space-y-6">
                {/* If the API is extended to include timestamps, you can uncomment this section */}
                {/*
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium text-muted-foreground">Created</h3>
                    <p className="text-sm flex items-center gap-1">
                      <CalendarIcon className="h-3 w-3" />
                      {formatDate(roleData.createdAt)}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-sm font-medium text-muted-foreground">Last Updated</h3>
                    <p className="text-sm flex items-center gap-1">
                      <CalendarIcon className="h-3 w-3" />
                      {formatDate(roleData.updatedAt)}
                    </p>
                  </div>
                </div>
                */}

                {/* Permissions section - display actual permissions */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Permissions</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {roleData.permissions && roleData.permissions.length > 0 ? (
                      roleData.permissions.map(permission => (
                        <Badge
                          key={permission.id}
                          variant="outline"
                          className="bg-slate-100 justify-start"
                        >
                          {permission.code}
                        </Badge>
                      ))
                    ) : (
                      <Badge variant="outline" className="bg-slate-100">
                        No permissions assigned
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate(getEditRoleRoute({ id: roleData.id }))}
                >
                  Edit Role
                </Button>
                {!roleData.isSystem && (
                  <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        className="w-full justify-start"
                        disabled={deleteRoleMutation.isPending}
                      >
                        {deleteRoleMutation.isPending ? 'Deleting...' : 'Delete Role'}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the role "
                          {roleData.name}" and could affect users who are assigned this role.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <Button variant="destructive" onClick={handleDeleteRole}>
                          Delete
                        </Button>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
                {roleData.isSystem && (
                  <div className="text-sm text-muted-foreground p-3 bg-muted rounded-lg">
                    System roles cannot be deleted
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewRolePage;
