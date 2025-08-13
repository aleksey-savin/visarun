import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

import ContactData from '@/components/Order/sections/ClientSection/ContactData';
import ClientData from '@/components/Order/sections/ClientSection/ClientData';

import useOrderStore, { StoreClient } from '@/stores/order/order-store';

import ClientBadge from '@/components/Order/ClientBadge';
import ClientCard from '@/components/Order/ClientCard';

import { formatCurrency } from '@/utils/currency';

const ClientSection = ({ client, totalAmount }: { client: StoreClient; totalAmount: number }) => {
  const { activeClientId, setActiveClientId } = useOrderStore();

  const [clientEditMode, setClientEditMode] = useState(
    !client?.citizenship?.id || !client?.passportExpirationDate
  );

  const handleSave = () => {
    setClientEditMode(false);
    setActiveClientId(client.id);
  };

  const handleClientEditMode = () => {
    if (activeClientId === client.id) {
      setClientEditMode(prev => !prev);
    } else if (activeClientId !== client.id) {
      setActiveClientId(client.id);
    }
  };

  const clientCanBeSaved: boolean = !!(
    client &&
    client?.citizenship?.id &&
    client?.passportExpirationDate
  );

  return (
    <>
      {!clientEditMode && (
        <ClientCard
          client={client}
          totalAmount={totalAmount}
          handleClientEditMode={handleClientEditMode}
        />
      )}
      {clientEditMode && (
        <Card className="bg-secondary m-0 p-6 border-x-0 border-t-0">
          <div className="flex items-center justify-between gap-2 text-lg">
            <ClientBadge client={client} showLinkedClients={false} />
            <span className="text-sm text-foreground">{formatCurrency(totalAmount, 'VND')}</span>
          </div>
          {client.isPrimary && <ContactData />}
          <div className="flex justify-between items-end">
            <ClientData client={client} />
            <Button disabled={!clientCanBeSaved} onClick={handleSave}>
              Save
            </Button>
          </div>
        </Card>
      )}
    </>
  );
};

export default ClientSection;
