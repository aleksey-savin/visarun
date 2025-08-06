import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { trpc } from '../../lib/trpcProvider';
import { getAllVisaCitizenshipSurchargesRoute } from '../../lib/routes';
import { toast } from 'sonner';
import FormPageLayout from '@/components/Forms/FormPageLayout';
import VisaCitizenshipSurchargeForm, {
  type VisaCitizenshipSurchargeFormData,
} from '@/components/Forms/VisaCitizenshipSurchargeForm';

const EditVisaCitizenshipSurchargePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);

  const {
    data: surchargeData,
    error,
    isLoading,
    isError,
  } = trpc.visaCitizenshipSurcharge.getOne.useQuery({ id: id! }, { enabled: !!id });

  const { data: citizenshipsData } = trpc.citizenship.getAll.useQuery({});
  const { data: countriesData } = trpc.country.getAll.useQuery();

  const editVisaCitizenshipSurchargeMutation = trpc.visaCitizenshipSurcharge.edit.useMutation({
    onSuccess: data => {
      const message =
        data.affectedVisaTypesCount > 0
          ? `Visa citizenship surcharge updated successfully. Applied to ${data.affectedVisaTypesCount} visa types.`
          : 'Visa citizenship surcharge updated successfully';
      toast.success(message);
      setSaveStatus('saved');
      setLastSavedTime(new Date());
      setIsSubmitting(false);
      navigate(getAllVisaCitizenshipSurchargesRoute());
    },
    onError: error => {
      toast.error(error.message);
      setSaveStatus('error');
      setIsSubmitting(false);
    },
  });

  const handleSubmit = (data: VisaCitizenshipSurchargeFormData) => {
    if (!id) {
      toast.error('Surcharge ID is required');
      return;
    }

    setIsSubmitting(true);
    setSaveStatus('saving');

    editVisaCitizenshipSurchargeMutation.mutate({
      id,
      ...data,
    });
  };

  const handleCancel = () => {
    navigate(getAllVisaCitizenshipSurchargesRoute());
  };

  if (isLoading || !citizenshipsData || !countriesData) {
    const breadcrumbs = [
      {
        label: 'Visa Citizenship Surcharges',
        onClick: () => navigate(getAllVisaCitizenshipSurchargesRoute()),
      },
      {
        label: 'Loading...',
        onClick: () => {},
      },
    ];

    return (
      <FormPageLayout breadcrumbs={breadcrumbs}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </FormPageLayout>
    );
  }

  if (isError) {
    const breadcrumbs = [
      {
        label: 'Visa Citizenship Surcharges',
        onClick: () => navigate(getAllVisaCitizenshipSurchargesRoute()),
      },
      {
        label: 'Error',
        onClick: () => {},
      },
    ];

    return (
      <FormPageLayout breadcrumbs={breadcrumbs}>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-600">Error: {error?.message}</div>
        </div>
      </FormPageLayout>
    );
  }

  if (!surchargeData?.visaCitizenshipSurcharge) {
    const breadcrumbs = [
      {
        label: 'Visa Citizenship Surcharges',
        onClick: () => navigate(getAllVisaCitizenshipSurchargesRoute()),
      },
      {
        label: 'Not Found',
        onClick: () => {},
      },
    ];

    return (
      <FormPageLayout breadcrumbs={breadcrumbs}>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Visa citizenship surcharge not found</div>
        </div>
      </FormPageLayout>
    );
  }

  const surcharge = surchargeData.visaCitizenshipSurcharge;

  const breadcrumbs = [
    {
      label: 'Visa Citizenship Surcharges',
      onClick: () => navigate(getAllVisaCitizenshipSurchargesRoute()),
    },
    {
      label: `Edit Surcharge`,
      onClick: () => {},
    },
  ];

  return (
    <FormPageLayout breadcrumbs={breadcrumbs} saveStatus={saveStatus} lastSavedTime={lastSavedTime}>
      <VisaCitizenshipSurchargeForm
        initialData={{
          citizenshipId: surcharge.citizenshipId,
          countryId: surcharge.countryId,
          visaTypeIds: surcharge.visaTypes?.map(vt => vt.visaType.id) || [],
          surchargeAmount: surcharge.surchargeAmount,
          note: surcharge.note || '',
          isGlobal: surcharge.isGlobal || false,
        }}
        citizenships={citizenshipsData.citizenships}
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
