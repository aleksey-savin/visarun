import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { trpc } from '../../lib/trpcProvider';
import { getAllVisaCitizenshipSurchargesRoute } from '../../lib/routes';
import { toast } from 'sonner';
import FormPageLayout from '@/components/Layout/Form';
import VisaCitizenshipSurchargeForm, {
  type VisaCitizenshipSurchargeFormData,
} from '@/components/VisaCitizenshipSurcharge/Form';

const EditVisaCitizenshipSurchargePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    data: surchargeData,
    error,
    isLoading,
    isError,
  } = trpc.visaCitizenshipSurcharge.getOne.useQuery({ id: id! }, { enabled: !!id });

  const { data: countriesData } = trpc.country.getAll.useQuery();

  const editVisaCitizenshipSurchargeMutation = trpc.visaCitizenshipSurcharge.edit.useMutation({
    onSuccess: data => {
      const message =
        data.affectedVisaTypesCount > 0
          ? `Visa citizenship surcharge updated successfully. Applied to ${data.affectedVisaTypesCount} visa types.`
          : 'Visa citizenship surcharge updated successfully';
      toast.success(message);
      setIsSubmitting(false);
      navigate(getAllVisaCitizenshipSurchargesRoute());
    },
    onError: error => {
      toast.error(error.message);
      setIsSubmitting(false);
    },
  });

  const handleSubmit = (data: VisaCitizenshipSurchargeFormData) => {
    if (!id) {
      toast.error('Surcharge ID is required');
      return;
    }

    setIsSubmitting(true);

    editVisaCitizenshipSurchargeMutation.mutate({
      id,
      ...data,
    });
  };

  const handleCancel = () => {
    navigate(getAllVisaCitizenshipSurchargesRoute());
  };

  if (isLoading || !countriesData) {
    return (
      <FormPageLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </FormPageLayout>
    );
  }

  if (isError) {
    return (
      <FormPageLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-600">Error: {error?.message}</div>
        </div>
      </FormPageLayout>
    );
  }

  if (!surchargeData?.visaCitizenshipSurcharge) {
    return (
      <FormPageLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Visa citizenship surcharge not found</div>
        </div>
      </FormPageLayout>
    );
  }

  const surcharge = surchargeData.visaCitizenshipSurcharge;

  return (
    <FormPageLayout>
      <VisaCitizenshipSurchargeForm
        initialData={{
          citizenshipId: surcharge.citizenshipId,
          countryId: surcharge.countryId,
          visaTypeIds: surcharge.visaTypes?.map(vt => vt.visaType.id) || [],
          surchargeAmount: surcharge.surchargeAmount,
          note: surcharge.note || '',
          isGlobal: surcharge.isGlobal || false,
        }}
        countries={countriesData.countries}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={isSubmitting}
        submitText="Update Surcharge"
        title="Visa Citizenship Surcharge Information"
      />
    </FormPageLayout>
  );
};

export default EditVisaCitizenshipSurchargePage;
