// import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

import ContactData from '@/components/Order/sections/ClientSection/ContactData';
import ClientData from '@/components/Order/sections/ClientSection/ClientData';

import useOrderStore, { StoreClient } from '@/stores/order/order-store';

import ClientBadge from '@/components/Order/ClientBadge';
import ClientCard from '@/components/Order/ClientCard';

import { formatCurrency } from '@/utils/currency';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

const ClientSection = ({ client, totalAmount }: { client: StoreClient; totalAmount: number }) => {
  const { order, activeClientId, setActiveClientId } = useOrderStore();

  const [editMode, setEditMode] = useState(false);

  const handleClientEditMode = () => {
    if (activeClientId === client.id && order.status !== 'draft') {
      setEditMode(true);
    }
    if (activeClientId !== client.id && order.status !== 'draft') {
      setActiveClientId(client.id);
    } else if (activeClientId !== client.id && order.status === 'draft') {
      setEditMode(true);
      setActiveClientId(client.id);
    }
  };

  useEffect(() => {
    if (activeClientId !== client.id) {
      setEditMode(false);
    }
  }, [activeClientId]);

  return (
    <>
      {!editMode && (
        <ClientCard
          client={client}
          totalAmount={totalAmount}
          handleClientEditMode={handleClientEditMode}
        />
      )}
      {editMode && (
        <Card className="bg-secondary m-0 p-6 border-x-0 border-t-0">
          <div className="flex items-center justify-between gap-2 text-lg">
            <ClientBadge client={client} showLinkedClients={false} />
            <span className="text-sm text-foreground">{formatCurrency(totalAmount, 'VND')}</span>
          </div>
          {client.isPrimary && <ContactData />}
          <div className="flex justify-between items-end">
            <ClientData client={client} />
            {order.status !== 'draft' && <Button onClick={() => setEditMode(false)}>Save</Button>}
          </div>
        </Card>
      )}
    </>
  );
};

export default ClientSection;
