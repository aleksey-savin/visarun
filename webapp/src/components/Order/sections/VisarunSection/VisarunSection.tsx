import useOrderStore, { type StoreClient } from '@/stores/order/order-store';
import PreferredTransfer from './PreferredTransfer';
import AvailableTransfers from './AvailableTransfers';
import BookedTransfers from './BookedTransfers';
import { Separator } from '@/components/ui/separator';
import AddVisa from '../VisaSection/AddVisa';

const VisarunSection = ({ client }: { client: StoreClient }) => {
  const {
    preferredDepartureCity,
    preferredVisarunCountry,
    preferredDepartureDate,
    visarunPassengers,
  } = useOrderStore();

  // Filter passengers for this specific client
  const clientVisarunPassengers = visarunPassengers.filter(
    passenger => passenger.clientId === client.id
  );

  const canSelectTransfer =
    preferredDepartureCity && preferredVisarunCountry && preferredDepartureDate;

  const canSearchTrips =
    preferredDepartureCity || preferredVisarunCountry || clientVisarunPassengers.length === 0;

  return (
    <>
      {canSearchTrips && <PreferredTransfer />}
      {canSelectTransfer && (
        <>
          <AvailableTransfers client={client} /> <Separator />
        </>
      )}
      {clientVisarunPassengers.length > 0 && !canSelectTransfer && (
        <>
          <Separator />
          <BookedTransfers client={client} />
          <Separator />
        </>
      )}
      {clientVisarunPassengers.length > 0 && <AddVisa client={client} activeService="visarun" />}
    </>
  );
};

export default VisarunSection;
