import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { trpc } from '../../lib/trpcProvider';
import { getAllCountriesRoute, getViewCountryRoute } from '../../lib/routes';
import { toast } from 'sonner';
import FormPageLayout from '@/components/forms/FormPageLayout';
import CountryForm, { type CountryFormData } from '@/components/forms/CountryForm';

const EditCountryPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);

  const { data, isLoading, isError, error } = trpc.country.getOne.useQuery(
    { id: id! },
    { enabled: !!id }
  );

  const editCountryMutation = trpc.country.edit.useMutation({
    onSuccess: () => {
      toast.success('Country updated successfully');
      setSaveStatus('saved');
      setLastSavedTime(new Date());
      setIsSubmitting(false);
      navigate(getViewCountryRoute({ id: id! }));
    },
    onError: error => {
      toast.error(error.message);
      setSaveStatus('error');
      setIsSubmitting(false);
    },
  });

  const handleSubmit = (formData: CountryFormData) => {
    setIsSubmitting(true);
    setSaveStatus('saving');
    editCountryMutation.mutate({
      id: id!,
      ...formData,
    });
  };

  const handleCancel = () => {
    navigate(getViewCountryRoute({ id: id! }));
  };

  if (isLoading) {
    const breadcrumbs = [
      {
        label: 'Countries',
        onClick: () => navigate(getAllCountriesRoute()),
      },
      {
        label: 'Loading...',
        onClick: () => {},
      },
    ];

    return (
      <FormPageLayout breadcrumbs={breadcrumbs}>
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </FormPageLayout>
    );
  }

  if (isError || !data?.country) {
    const breadcrumbs = [
      {
        label: 'Countries',
        onClick: () => navigate(getAllCountriesRoute()),
      },
      {
        label: 'Error',
        onClick: () => {},
      },
    ];

    return (
      <FormPageLayout breadcrumbs={breadcrumbs}>
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <h3 className="font-medium text-lg mb-2">Error Loading Country</h3>
          <p>{error?.message || 'Country not found'}</p>
          <button
            onClick={() => navigate(getAllCountriesRoute())}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Back to Countries
          </button>
        </div>
      </FormPageLayout>
    );
  }

  const country = data.country;

  const breadcrumbs = [
    {
      label: country.name,
      onClick: () => navigate(getViewCountryRoute({ id: id! })),
    },
    {
      label: 'Edit Country',
      onClick: () => {},
    },
  ];

  return (
    <FormPageLayout breadcrumbs={breadcrumbs} saveStatus={saveStatus} lastSavedTime={lastSavedTime}>
      <CountryForm
        initialData={{
          name: country.name,
          favourite: country.favourite,
          eVisaAvailable: country.eVisaAvailable,
          multivisaAvailable: country.multivisaAvailable,
        }}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={isSubmitting}
        submitText="Update Country"
        title="Country Information"
      />
    </FormPageLayout>
  );
};

export default EditCountryPage;
