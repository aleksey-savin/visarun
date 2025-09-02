import { useParams, useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { getAllSeatClassesRoute } from '@/lib/routes';
import FormPageLayout from '@/components/Forms/FormPageLayout';
import SeatClassForm, { SeatClassFormData } from '@/components/SeatClass/Form';

export default function EditSeatClassPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;

  const {
    data: seatClassData,
    isLoading,
    error,
  } = trpc.seatClass.getOne.useQuery({ id: id! }, { enabled: isEditing });

  const createMutation = trpc.seatClass.create.useMutation({
    onSuccess: () => {
      toast.success('Seat class created successfully');
      navigate(getAllSeatClassesRoute());
    },
    onError: error => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const editMutation = trpc.seatClass.edit.useMutation({
    onSuccess: () => {
      toast.success('Seat class updated successfully');
      navigate(getAllSeatClassesRoute());
    },
    onError: error => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const handleSubmit = (data: SeatClassFormData) => {
    const submitData = {
      name: data.name.trim(),
      description: data.description.trim() || undefined,
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
    navigate(getAllSeatClassesRoute());
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
          <span>Error loading seat class: {error.message}</span>
        </div>
      </div>
    );
  }

  const initialData = seatClassData?.seatClass
    ? {
        name: seatClassData.seatClass.name,
        description: seatClassData.seatClass.description || '',
        icon: seatClassData.seatClass.icon || 'none',
      }
    : undefined;

  return (
    <FormPageLayout
      title={isEditing ? 'Edit Seat Class' : 'Create Seat Class'}
      onBack={handleCancel}
    >
      <SeatClassForm
        initialData={initialData}
        isEditing={isEditing}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={createMutation.isPending || editMutation.isPending}
        title={isEditing ? 'Edit Seat Class' : 'Create New Seat Class'}
      />
    </FormPageLayout>
  );
}
