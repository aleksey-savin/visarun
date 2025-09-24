import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { trpc } from '../../lib/trpcProvider';
import { getAllVisaTypesRoute } from '../../lib/routes';
import { toast } from 'sonner';
import FormPageLayout from '@/components/Layout/Form';
import VisaTypeForm, { type VisaTypeFormData } from '@/components/VisaType/Form';

const CreateVisaTypePage = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: countriesData } = trpc.country.getAll.useQuery();

  const createVisaTypeMutation = trpc.visaType.create.useMutation({
    onSuccess: () => {
      toast.success('Visa type created successfully');
      navigate(getAllVisaTypesRoute());
    },
    onError: error => {
      toast.error(error.message);
      setIsSubmitting(false);
    },
  });

  const handleSubmit = (data: VisaTypeFormData) => {
    setIsSubmitting(true);
    createVisaTypeMutation.mutate(data);
  };

  const handleCancel = () => {
    navigate(getAllVisaTypesRoute());
  };

  if (!countriesData) {
    return (
      <FormPageLayout>
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </FormPageLayout>
    );
  }

  return (
    <FormPageLayout>
      <VisaTypeForm
        countries={countriesData.countries}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={isSubmitting}
        submitText="Create Visa Type"
        title="Visa Type Information"
      />
    </FormPageLayout>
  );
};

export default CreateVisaTypePage;
