import useOrderStore, { StoreClient } from '@/stores/order/order-store';

import DocumentsUpload from '../sections/PersonalDataSection/DocumentsUpload';
import ClientName from '../sections/ClientSection/ClientName';
import UserContacts from '../sections/UserSection/UserContacts';
import Comments from '../Comments';
import OtherRequirements from '../sections/PersonalDataSection/OtherRequirements';
import PassportExpiry from '../sections/ClientSection/PassportExpiry';

import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';

const PersonalData = ({ client }: { client: StoreClient }) => {
  const { setActiveClientId, orderItems } = useOrderStore();

  const visaRequirementsDocuments = client.visaRequirements
    ? client.visaRequirements.filter((item: any) => item.inputType === 'document')
    : [];

  const otherVisaRequirements = client.visaRequirements
    ? client.visaRequirements.filter((item: any) => item.inputType !== 'document')
    : [];

  const handleConfirm = () => {
    setActiveClientId('');
  };

  const showComponent = orderItems.filter(item => item.clientId === client.id).length > 0;

  return (
    <>
      {showComponent && (
        <>
          <DocumentsUpload requirements={visaRequirementsDocuments} client={client} />
          <PassportExpiry client={client} />
        </>
      )}
      <UserContacts client={client} />
      {client.isPrimary && <ClientName client={client} />}
      <Separator />
      {showComponent && otherVisaRequirements.length > 0 && (
        <>
          <OtherRequirements client={client} requirements={otherVisaRequirements} /> <Separator />
        </>
      )}

      <div className="flex flex-wrap justify-between align-center">
        <Comments />
        <Button type="button" onClick={handleConfirm}>
          Save & close
        </Button>
      </div>
    </>
  );
};

export default PersonalData;
