import ClientSummary from './ClientSummary';

import useOrderStore from '@/stores/order/order-store';

const SummarySection = () => {
  const { clients } = useOrderStore();
  return (
    <div className="grid grid-cols-1 gap-2">
      <span className="text-sm font-semibold">Summary</span>
      {clients.map(client => (
        <ClientSummary client={client} key={client.id} />
      ))}
    </div>
  );
};

export default SummarySection;
