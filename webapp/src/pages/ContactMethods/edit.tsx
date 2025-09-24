import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { trpc } from '@/lib/trpcProvider';
import { getAllContactMethodsRoute } from '@/lib/routes';
import { ContactMethodForm } from '@/components/ContactMethod';
import { ContactMethodFormData } from '@/lib/schemas/contactMethod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function EditContactMethodPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Queries
  const { data: contactMethodData, isLoading } = trpc.contactMethod.getOne.useQuery(
    { id: id! },
    {
      retry: 1,
      enabled: !!id,
    }
  );

  // Mutations
  const editMutation = trpc.contactMethod.edit.useMutation({
    onSuccess: () => {
      toast.success('Contact method updated successfully');
      navigate(getAllContactMethodsRoute());
    },
    onError: error => {
      toast.error('Failed to update contact method', {
        description: error.message,
      });
      setIsSubmitting(false);
    },
  });

  const handleSubmit = async (data: ContactMethodFormData) => {
    try {
      setIsSubmitting(true);
      await editMutation.mutateAsync({
        id: id!,
        name: data.name,
        description: data.description || undefined,
        icon: data.icon || undefined,
      });
    } catch (error) {
      // Error handling is done in the mutation's onError
      console.error('Error updating contact method:', error);
    }
  };

  const handleCancel = () => {
    navigate(getAllContactMethodsRoute());
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-8">
        <div className="flex items-center gap-3">
          <MessageCircle className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">Loading...</h1>
        </div>
        <Card>
          <CardHeader>
            <div className="h-6 bg-muted rounded animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="h-8 bg-muted rounded animate-pulse" />
              <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
              <div className="h-4 bg-muted rounded w-1/2 animate-pulse" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!contactMethodData?.contactMethod) {
    return (
      <div className="container mx-auto py-6 space-y-8">
        <div className="flex items-center gap-3">
          <MessageCircle className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">Contact Method Not Found</h1>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700">Contact Method Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">The contact method with ID {id} could not be found.</p>
            <div className="mt-4">
              <Button variant="secondary" onClick={() => navigate(getAllContactMethodsRoute())}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Contact Methods
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const contactMethod = contactMethodData.contactMethod;

  return (
    <ContactMethodForm
      initialData={{
        name: contactMethod.name,
        description: contactMethod.description || '',
        icon: contactMethod.icon || '',
      }}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      isSubmitting={isSubmitting}
      submitButtonText="Update"
    />
  );
}
