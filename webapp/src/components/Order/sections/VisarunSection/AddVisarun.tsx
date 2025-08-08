import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

const AddVisarun = () => {
  return (
    <>
      <Alert variant="destructive">
        <AlertTitle>Notice</AlertTitle>
        <AlertDescription>
          The visarun service is currently in development. This feature is not yet available.
        </AlertDescription>
      </Alert>
    </>
  );
};

export default AddVisarun;
