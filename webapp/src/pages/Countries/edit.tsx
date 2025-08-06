import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { trpc } from '../../lib/trpcProvider';
import { getAllCountriesRoute, getViewCountryRoute } from '../../lib/routes';
import { toast } from 'sonner';
import FormPageLayout from '@/components/Forms/FormPageLayout';
import CountryForm, { type CountryFormData } from '@/components/Forms/CountryForm';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const EditCountryPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<CountryFormData | null>(null);

  const { data, isLoading, isError, error } = trpc.country.getOne.useQuery(
    { id: id! },
    { enabled: !!id }
  );

  const editCountryMutation = trpc.country.edit.useMutation({
    onSuccess: data => {
      const message =
        data.affectedVisaTypesCount > 0
          ? `Country updated successfully. ${data.affectedVisaTypesCount} visa types were updated with global multi-entry settings.`
          : 'Country updated successfully';
      toast.success(message);
      setSaveStatus('saved');
      setLastSavedTime(new Date());
      setIsSubmitting(false);
      setShowConfirmDialog(false);
      setPendingFormData(null);
      navigate(getViewCountryRoute({ id: id! }));
    },
    onError: error => {
      toast.error(error.message);
      setSaveStatus('error');
      setIsSubmitting(false);
      setShowConfirmDialog(false);
      setPendingFormData(null);
    },
  });

  const handleSubmit = (formData: CountryFormData) => {
    // Check if global multivisa is being enabled with a cost
    if (formData.multivisaIsGlobal && formData.multivisaGlobalExtraCost !== undefined) {
      // Need to get visa types count first
      setPendingFormData(formData);
      // For now, we'll show the dialog and let the backend handle the count
      setShowConfirmDialog(true);
    } else {
      executeUpdate(formData);
    }
  };

  const executeUpdate = (formData: CountryFormData) => {
    setIsSubmitting(true);
    setSaveStatus('saving');
    editCountryMutation.mutate({
      id: id!,
      ...formData,
    });
  };

  const handleConfirmGlobalUpdate = () => {
    if (pendingFormData) {
      executeUpdate(pendingFormData);
    }
  };

  const handleCancelGlobalUpdate = () => {
    setShowConfirmDialog(false);
    setPendingFormData(null);
    setIsSubmitting(false);
    setSaveStatus('idle');
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
          multivisaIsGlobal: country.multivisaIsGlobal,
          multivisaGlobalExtraCost: country.multivisaGlobalExtraCost ?? undefined,
        }}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={isSubmitting}
        submitText="Update Country"
        title="Country Information"
      />

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Global Multi-entry Update</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to enable global multi-entry settings for this country. This will:
              <br />
              <br />
              • Set all existing visa types for this country to multi-entry
              <br />• Update their multi-entry extra cost to{' '}
              {pendingFormData?.multivisaGlobalExtraCost?.toLocaleString()} VND
              <br />
              • Make multi-entry settings non-editable for individual visa types
              <br />
              <br />
              This action will affect all visa types for this country. Do you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelGlobalUpdate}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmGlobalUpdate}>
              Yes, Update All Visa Types
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </FormPageLayout>
  );
};

export default EditCountryPage;
