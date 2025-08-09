import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

import ContactData from '@/components/Order/sections/ClientSection/ContactData';
import ClientData from '@/components/Order/sections/ClientSection/ClientData';

import { Client } from '@/types/Client.js';

import ClientBadge from '@/components/Order/ClientBadge';
import ClientCard from '@/components/Order/ClientCard';

import { formatCurrency } from '@/utils/currency';

const ClientSection = ({ client, totalAmount }: { client: Client; totalAmount: number }) => {
  const [clientEditMode, setClientEditMode] = useState(
    !client?.citizenshipId || !client?.passportExpirationDate
  );

  const handleClientEditMode = () => {
    setClientEditMode(prev => !prev);
  };
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
            <Button onClick={handleClientEditMode}>Save</Button>
          </div>
        </Card>
      )}
    </>
  );
};

export default ClientSection;
