import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { trpc } from '../../lib/trpcProvider';
import { getAllVisaCitizenshipSurchargesRoute } from '../../lib/routes';
import { toast } from 'sonner';
import FormPageLayout from '@/components/Layout/Form';
import VisaCitizenshipSurchargeForm, {
  type VisaCitizenshipSurchargeFormData,
} from '@/components/VisaCitizenshipSurcharge/Form';

const CreateVisaCitizenshipSurchargePage = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: countriesData } = trpc.country.getAll.useQuery();

  const createVisaCitizenshipSurchargeMutation = trpc.visaCitizenshipSurcharge.create.useMutation({
    onSuccess: data => {
      const message =
        data.affectedVisaTypesCount > 0
          ? `Visa citizenship surcharge created successfully. Applied to ${data.affectedVisaTypesCount} visa types.`
          : 'Visa citizenship surcharge created successfully';
      toast.success(message);
      navigate(getAllVisaCitizenshipSurchargesRoute());
    },
    onError: error => {
      toast.error(error.message);
      setIsSubmitting(false);
    },
  });

  const handleSubmit = (data: VisaCitizenshipSurchargeFormData) => {
    setIsSubmitting(true);
    createVisaCitizenshipSurchargeMutation.mutate(data);
  };

  const handleCancel = () => {
    navigate(getAllVisaCitizenshipSurchargesRoute());
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
      <VisaCitizenshipSurchargeForm
        countries={countriesData.countries}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={isSubmitting}
        submitText="Create Surcharge"
        title="Visa Citizenship Surcharge Information"
      />
    </FormPageLayout>
  );
};

export default CreateVisaCitizenshipSurchargePage;
