// src/pages/roles/EditRolePage.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { trpc } from '@/lib/trpcProvider';
import { getAllRolesRoute } from '@/lib/routes';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

// Form schema for role editing
const formSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  permissions: z.array(z.string()),
});

type FormData = {
  name: string;
  description?: string;
  permissions: string[];
};

export default function EditRolePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch role data
  const {
    data: roleData,
    isLoading: isRoleLoading,
    error: roleError,
  } = trpc.role.getOne.useQuery({ id: id! }, { enabled: !!id });

  // Fetch permissions data
  const {
    data: permissionsData,
    isLoading: isPermissionsLoading,
    error: permissionsError,
  } = trpc.permission.getAll.useQuery();

  // Initialize form
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      permissions: [],
    },
  });

  // Set form values and selected permissions when role data is loaded
  useEffect(() => {
    if (!roleData?.role) return;

    const permissionIds = roleData.role.permissionIds || [];

    form.reset({
      name: roleData.role.name || '',
      description: roleData.role.description || '',
      permissions: permissionIds,
    });

    setSelectedPermissions(permissionIds);
  }, [roleData, form]);

  // Handle permission checkbox changes
  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    if (checked) {
      // Add permission to selected list
      setSelectedPermissions(prev => {
        const newPermissions = [...prev, permissionId];
        form.setValue('permissions', newPermissions, { shouldDirty: true, shouldTouch: true });
        return newPermissions;
      });
    } else {
      // Remove permission from selected list
      setSelectedPermissions(prev => {
        const newPermissions = prev.filter(id => id !== permissionId);
        form.setValue('permissions', newPermissions, { shouldDirty: true, shouldTouch: true });
        return newPermissions;
      });
    }

    // Show a visual feedback toast
    toast.success(checked ? 'Permission added' : 'Permission removed', {
      duration: 1000,
      position: 'bottom-right',
    });
  };

  // Edit role mutation
  const editMutation = trpc.role.edit.useMutation({
    onSuccess: () => {
      toast.success('Role updated successfully');
      navigate(getAllRolesRoute());
    },
    onError: (error: { message: string }) => {
      setError(`Failed to update role: ${error.message}`);
      toast.error('Error updating role', {
        description: error.message,
      });
    },
  });

  // Handle form submission
  const onSubmit = form.handleSubmit(async values => {
    try {
      setIsSubmitting(true);
      setError(null);

      // Show how many permissions are being saved
      toast.info(`Saving role with ${selectedPermissions.length} permissions`, {
        duration: 2000,
        position: 'bottom-right',
      });

      await editMutation.mutateAsync({
        id: id!,
        name: values.name,
        description: values.description || null,
        permissions: selectedPermissions,
      });
    } catch (err) {
      console.error('Submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  });

  const isLoading = isRoleLoading || isPermissionsLoading;
  const isSystemRole = roleData?.role?.isSystem || false;

  // If there's an error loading the role, show error message
  if (roleError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(getAllRolesRoute())}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Edit Role</h1>
        </div>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p className="font-bold">Error loading role</p>
          <p>{roleError instanceof Error ? roleError.message : 'Unknown error'}</p>
          <Button className="mt-4" onClick={() => navigate(getAllRolesRoute())}>
            Go Back to Roles
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate(getAllRolesRoute())}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Edit Role</h1>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Edit the role's core details</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={onSubmit} className="space-y-8">
                  {/* Role Name */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter role name" {...field} disabled={isSystemRole} />
                        </FormControl>
                        {isSystemRole && (
                          <FormDescription className="text-amber-500">
                            System role names cannot be changed
                          </FormDescription>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Description */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter role description"
                            className="min-h-[80px]"
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Buttons */}
                  <div className="flex gap-4">
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Saving…' : 'Save Changes'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate(getAllRolesRoute())}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Permissions */}
          <Card>
            <CardHeader>
              <CardTitle>Permissions ({selectedPermissions.length} selected)</CardTitle>
              <CardDescription>
                {isSystemRole
                  ? 'System role permissions are managed automatically'
                  : 'Manage what actions this role can perform'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isSystemRole ? (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded">
                  <p className="font-bold mb-2">System Role</p>
                  <p>
                    System role permissions are managed automatically and cannot be modified.
                    {roleData?.role?.name === 'admin' && ' Admin role has full system access.'}
                    {roleData?.role?.name === 'client' &&
                      ' Client role has no special permissions.'}
                  </p>
                  {roleData?.role?.permissions && roleData.role.permissions.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium mb-2">Current permissions:</p>
                      <div className="flex flex-wrap gap-2">
                        {roleData.role.permissions.map(permission => (
                          <span
                            key={permission.id}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800"
                          >
                            {permission.code}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : permissionsError ? (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  <p className="font-bold mb-2">Error loading permissions</p>
                  <p>
                    {permissionsError instanceof Error ? permissionsError.message : 'Unknown error'}
                  </p>
                  <Button
                    variant="outline"
                    className="mt-3 bg-white"
                    onClick={() => navigate(getAllRolesRoute())}
                  >
                    Go Back
                  </Button>
                </div>
              ) : permissionsData?.groupedPermissions ? (
                <div className="space-y-6">
                  {Object.entries(permissionsData.groupedPermissions).map(
                    ([category, permissions]) => (
                      <div key={category} className="space-y-3">
                        <h3 className="text-md font-semibold">{category}</h3>
                        <Separator />
                        <div className="space-y-2">
                          {permissions.map(permission => (
                            <div
                              key={permission.id}
                              className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3 hover:bg-slate-50 cursor-pointer"
                            >
                              <div className="flex items-center h-5">
                                <Checkbox
                                  id={`permission-${permission.id}`}
                                  checked={selectedPermissions.includes(permission.id)}
                                  onCheckedChange={checked =>
                                    handlePermissionChange(permission.id, checked === true)
                                  }
                                  disabled={isSystemRole}
                                />
                              </div>
                              <div className="space-y-1 leading-none flex-1">
                                <label
                                  htmlFor={`permission-${permission.id}`}
                                  className="text-sm font-medium cursor-pointer hover:text-blue-600 flex items-center"
                                >
                                  {permission.description}
                                </label>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <div className="bg-yellow-50 p-4 rounded text-yellow-700 border border-yellow-200">
                  <div className="font-medium mb-2">No permissions found</div>
                  <p>Contact an administrator to set up permissions for this system.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
