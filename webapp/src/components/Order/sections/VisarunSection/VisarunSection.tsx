import useOrderStore from '@/stores/order/order-store';
import PreferredTransfer from './PreferredTransfer';
import AvailableTransfers from './AvailableTransfers';
import { Separator } from '@/components/ui/separator';

const VisarunSection = () => {
  const { preferredDepartureCity, preferredVisarunCountry, preferredDepartureDate } =
    useOrderStore();

  const canSelectTransfer =
    preferredDepartureCity && preferredVisarunCountry && preferredDepartureDate;

  return (
    <>
      <PreferredTransfer />
      {canSelectTransfer && <AvailableTransfers />}
      <Separator />
    </>
  );
};

export default VisarunSection;
