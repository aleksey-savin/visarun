import { useParams, useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { getAllTransportTypesRoute } from '@/lib/routes';
import FormPageLayout from '@/components/Layout/Form';
import TransportTypeForm, { TransportTypeFormData } from '@/components/TransportType/Form';

export default function EditTransportTypePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;

  const {
    data: transportTypeData,
    isLoading,
    error,
  } = trpc.transportType.getOne.useQuery({ id: id! }, { enabled: isEditing });

  const createMutation = trpc.transportType.create.useMutation({
    onSuccess: () => {
      toast.success('Transport type created successfully');
      navigate(getAllTransportTypesRoute());
    },
    onError: error => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const editMutation = trpc.transportType.edit.useMutation({
    onSuccess: () => {
      toast.success('Transport type updated successfully');
      navigate(getAllTransportTypesRoute());
    },
    onError: error => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const handleSubmit = (data: TransportTypeFormData) => {
    const submitData = {
      name: data.name.trim(),
      icon: data.icon && data.icon !== 'none' ? data.icon : undefined,
    };

    if (isEditing) {
      editMutation.mutate({
        id: id!,
        ...submitData,
      });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleCancel = () => {
    navigate(getAllTransportTypesRoute());
  };

  if (isEditing && isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isEditing && error) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 text-red-600">
          <AlertTriangle className="h-5 w-5" />
          <span>Error loading transport type: {error.message}</span>
        </div>
      </div>
    );
  }

  const initialData = transportTypeData?.transportType
    ? {
        name: transportTypeData.transportType.name,
        icon: transportTypeData.transportType.icon || 'none',
      }
    : undefined;

  return (
    <FormPageLayout
      title={isEditing ? 'Edit Transport Type' : 'Create Transport Type'}
      onBack={handleCancel}
    >
      <TransportTypeForm
        initialData={initialData}
        isEditing={isEditing}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={createMutation.isPending || editMutation.isPending}
        title={isEditing ? 'Edit Transport Type' : 'Create New Transport Type'}
      />
    </FormPageLayout>
  );
}
