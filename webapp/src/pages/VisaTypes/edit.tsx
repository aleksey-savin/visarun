import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { trpc } from '../../lib/trpcProvider';
import { getAllVisaTypesRoute } from '../../lib/routes';
import { toast } from 'sonner';
import FormPageLayout from '@/components/Forms/FormPageLayout';
import VisaTypeForm, { type VisaTypeFormData } from '@/components/VisaType/Form';

const EditVisaTypePage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: countriesData } = trpc.country.getAll.useQuery();

  const { data: visaTypeData, isLoading } = trpc.visaType.getOne.useQuery(
    { id: id! },
    { enabled: !!id }
  );

  const editVisaTypeMutation = trpc.visaType.edit.useMutation({
    onSuccess: () => {
      toast.success('Visa type updated successfully');
      setIsSubmitting(false);
      navigate(getAllVisaTypesRoute());
    },
    onError: error => {
      toast.error(error.message);
      setIsSubmitting(false);
    },
  });

  const handleSubmit = (data: VisaTypeFormData) => {
    if (!id) {
      toast.error('Visa type ID is required');
      return;
    }

    setIsSubmitting(true);

    editVisaTypeMutation.mutate({
      id,
      ...data,
    });
  };

  const handleCancel = () => {
    navigate(getAllVisaTypesRoute());
  };

  if (isLoading || !countriesData) {
    const breadcrumbs = [
      {
        label: 'Visa Types',
        onClick: () => navigate(getAllVisaTypesRoute()),
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

  if (!visaTypeData?.visaType) {
    const breadcrumbs = [
      {
        label: 'Visa Types',
        onClick: () => navigate(getAllVisaTypesRoute()),
      },
      {
        label: 'Error',
        onClick: () => {},
      },
    ];

    return (
      <FormPageLayout breadcrumbs={breadcrumbs}>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-600">Visa type not found</div>
        </div>
      </FormPageLayout>
    );
  }

  const visaType = visaTypeData.visaType;

  const breadcrumbs = [
    {
      label: 'Visa Types',
      onClick: () => navigate(getAllVisaTypesRoute()),
    },
    {
      label: `Edit ${visaType.name}`,
      onClick: () => {},
    },
  ];

  return (
    <FormPageLayout breadcrumbs={breadcrumbs}>
      <VisaTypeForm
        initialData={{
          name: visaType.name,
          serviceCost: visaType.serviceCost,
          countryId: visaType.countryId,
          isMultientry: visaType.isMultientry,
          favourite: visaType.favourite,
          multientryExtraCost: visaType.multientryExtraCost || undefined,
          processingMode: visaType.processingMode as 'fixed' | 'approximate',
          processingUnit: visaType.processingUnit as 'hours' | 'days',
          processingValueFixed: visaType.processingValueFixed || undefined,
          processingValueMin: visaType.processingValueMin || undefined,
          processingValueMax: visaType.processingValueMax || undefined,
          submissionDayIncluded: visaType.submissionDayIncluded,
        }}
        countries={countriesData.countries}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={isSubmitting}
        submitText="Update Visa Type"
        title="Visa Type Information"
      />
    </FormPageLayout>
  );
};

export default EditVisaTypePage;
