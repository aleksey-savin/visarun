import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Shield, ArrowLeft } from 'lucide-react';

import { trpc } from '@/lib/trpcProvider';
import { getAllRolesRoute } from '@/lib/routes';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import RoleForm from '@/components/Roles/RoleForm';

export default function EditRolePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch role data
  const {
    data: roleData,
    isLoading: isRoleLoading,
    error: roleError,
  } = trpc.role.getOne.useQuery({ id: id! }, { enabled: !!id, retry: 1 });

  // Fetch permissions data
  const { data: permissionsData, isLoading: isPermissionsLoading } =
    trpc.permission.getAll.useQuery(undefined, { retry: 1 });

  // Edit role mutation
  const editMutation = trpc.role.edit.useMutation({
    onSuccess: () => {
      toast.success('Role updated successfully', {
        description: 'The role information has been saved.',
      });
      navigate(getAllRolesRoute());
    },
    onError: error => {
      toast.error('Failed to update role', {
        description: error.message,
      });
    },
  });

  async function handleSubmit(values: {
    name: string;
    description?: string;
    permissions: string[];
  }) {
    try {
      setIsSubmitting(true);

      await editMutation.mutateAsync({
        id: id!,
        name: values.name,
        description: values.description || null,
        permissions: values.permissions,
      });
    } catch (error) {
      console.error('Error updating role:', error);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleCancel() {
    navigate(getAllRolesRoute());
  }

  const isLoading = isRoleLoading || isPermissionsLoading;

  // If there's an error loading the role, show error message
  if (roleError) {
    return (
      <>
        <div className="sticky top-0 z-10 bg-background border-b flex px-6 justify-between gap-2 items-center h-[45px]">
          <div className="flex gap-3 items-center text-sm min-h-[45px]">
            <Shield className="h-4 w-4" />
            <span className="text-destructive">Role not found</span>
          </div>
        </div>
        <div className="p-6">
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-700">Role Not Found</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-600">
                {roleError instanceof Error ? roleError.message : 'The role could not be found.'}
              </p>
              <div className="mt-4">
                <Button variant="secondary" onClick={() => navigate(getAllRolesRoute())}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to All Roles
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  if (!roleData?.role && !isLoading) {
    return (
      <>
        <div className="sticky top-0 z-10 bg-background border-b flex px-6 justify-between gap-2 items-center h-[45px]">
          <div className="flex gap-3 items-center text-sm min-h-[45px]">
            <Shield className="h-4 w-4" />
            <span className="text-destructive">Role not found</span>
          </div>
        </div>
        <div className="p-6">
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-700">Role Not Found</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-600">The role with ID {id} could not be found.</p>
              <div className="mt-4">
                <Button variant="secondary" onClick={() => navigate(getAllRolesRoute())}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to All Roles
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Form */}
      <RoleForm
        mode="edit"
        roleData={roleData?.role}
        permissionsData={permissionsData}
        isLoading={isLoading}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={isSubmitting}
      />
    </>
  );
}
