import { useParams, useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { getAllTransportsRoute } from '@/lib/routes';
import FormPageLayout from '@/components/Layout/Form';
import TransportForm, { TransportFormData } from '@/components/Transport/Form';

export default function EditTransportPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;

  const {
    data: transportData,
    isLoading,
    error,
    refetch: refetchTransport,
  } = trpc.transport.getOne.useQuery({ id: id! }, { enabled: isEditing });

  const createMutation = trpc.transport.create.useMutation({
    onSuccess: () => {
      navigate(getAllTransportsRoute());
    },
    onError: error => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const editMutation = trpc.transport.edit.useMutation({
    onSuccess: () => {
      refetchTransport();
    },
    onError: error => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const handleSubmit = (data: TransportFormData) => {
    const submitData = {
      transportTypeId: data.transportTypeId,
      name: data.name.trim(),
      description: data.description.trim() || undefined,
      seatCount: data.seatCount ? Number(data.seatCount) : undefined,
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
    navigate(getAllTransportsRoute());
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
          <span>Error loading transport: {error.message}</span>
        </div>
      </div>
    );
  }

  const initialData = transportData?.transport
    ? {
        transportTypeId: transportData.transport.transportTypeId,
        name: transportData.transport.name,
        description: transportData.transport.description || '',
        seatCount: transportData.transport.seatCount?.toString() || '',
      }
    : undefined;

  return (
    <FormPageLayout>
      <TransportForm
        initialData={initialData}
        transportId={id}
        isEditing={isEditing}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={createMutation.isPending || editMutation.isPending}
        title={isEditing ? 'Edit Transport' : 'Create New Transport'}
      />
    </FormPageLayout>
  );
}
