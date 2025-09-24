import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { trpc } from '@/lib/trpcProvider';
import { getAllContactMethodsRoute } from '@/lib/routes';
import { ContactMethodForm } from '@/components/ContactMethod';
import { ContactMethodFormData } from '@/lib/schemas/contactMethod';
import { toast } from 'sonner';

export default function CreateContactMethodPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createMutation = trpc.contactMethod.create.useMutation({
    onSuccess: () => {
      toast.success('Contact method created successfully');
      navigate(getAllContactMethodsRoute());
    },
    onError: error => {
      toast.error('Failed to create contact method', {
        description: error.message,
      });
      setIsSubmitting(false);
    },
  });

  const handleSubmit = async (data: ContactMethodFormData) => {
    try {
      setIsSubmitting(true);
      await createMutation.mutateAsync({
        name: data.name,
        description: data.description || undefined,
        icon: data.icon || undefined,
      });
    } catch (error) {
      // Error handling is done in the mutation's onError
      console.error('Error creating contact method:', error);
    }
  };

  const handleCancel = () => {
    navigate(getAllContactMethodsRoute());
  };

  return (
    <ContactMethodForm
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      isSubmitting={isSubmitting}
      submitButtonText="Create"
    />
  );
}
