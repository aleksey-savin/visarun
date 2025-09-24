import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { trpc } from '@/lib/trpcProvider';
import { getAllRolesRoute } from '@/lib/routes';
import { toast } from 'sonner';
import RoleForm from '@/components/Roles/RoleForm';

export default function CreateRolePage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch permissions data
  const { data: permissionsData, isLoading: isPermissionsLoading } =
    trpc.permission.getAll.useQuery();

  // Create role mutation
  const createRoleMutation = trpc.role.create.useMutation({
    onSuccess: () => {
      toast.success('Role created successfully', {
        description: 'The new role has been created and is ready to use.',
      });
      navigate(getAllRolesRoute());
    },
    onError: error => {
      toast.error('Failed to create role', {
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

      await createRoleMutation.mutateAsync({
        name: values.name,
        description:
          values.description && values.description.trim() !== '' ? values.description : undefined,
        permissions: values.permissions,
      });
    } catch (error) {
      console.error('Error creating role:', error);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleCancel() {
    navigate(getAllRolesRoute());
  }

  return (
    <>
      {/* Form */}
      <RoleForm
        mode="create"
        permissionsData={permissionsData}
        isLoading={isPermissionsLoading}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={isSubmitting}
      />
    </>
  );
}
