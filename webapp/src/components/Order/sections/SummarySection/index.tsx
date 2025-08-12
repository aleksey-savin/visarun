import ClientSummary from './ClientSummary';
import OrderSummary from './OrderSummary';

import useOrderStore from '@/stores/order/order-store';

const SummarySection = () => {
  const { clients } = useOrderStore();
  return (
    <div className="grid grid-cols-1 gap-2">
      <span className="text-sm font-semibold">Summary</span>
      {clients.map(client => (
        <ClientSummary client={client} key={client.id} />
      ))}
      <OrderSummary />
    </div>
  );
};

export default SummarySection;
