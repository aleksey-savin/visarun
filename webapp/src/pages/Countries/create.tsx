import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { trpc } from '../../lib/trpcProvider';
import { getAllCountriesRoute } from '../../lib/routes';
import { toast } from 'sonner';
import FormPageLayout from '@/components/Layout/Form';
import CountryForm, { type CountryFormData } from '@/components/Country/Form';

const CreateCountryPage = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createCountryMutation = trpc.country.create.useMutation({
    onSuccess: () => {
      toast.success('Country created successfully');
      navigate(getAllCountriesRoute());
    },
    onError: error => {
      toast.error(error.message);
      setIsSubmitting(false);
    },
  });

  const handleSubmit = (data: CountryFormData) => {
    setIsSubmitting(true);
    createCountryMutation.mutate(data);
  };

  const handleCancel = () => {
    navigate(getAllCountriesRoute());
  };

  return (
    <FormPageLayout>
      <CountryForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={isSubmitting}
        submitText="Create Country"
        title="Country Information"
      />
    </FormPageLayout>
  );
};

export default CreateCountryPage;
