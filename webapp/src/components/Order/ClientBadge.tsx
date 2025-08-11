import { StoreClient } from '@/stores/order/order-store';

import { Badge } from '../ui/badge';

import { Crown, User } from 'lucide-react';

const ClientBadge = ({
  client,
  showLinkedClients,
}: {
  client: StoreClient;
  showLinkedClients: boolean;
}) => {
  return (
    <>
      {client.isPrimary && (
        <div className="flex gap-1">
          <Badge variant="primary">
            <Crown />
            <span>
              {client.firstName || ''} {client.lastName || ''}
            </span>
          </Badge>
          {showLinkedClients && (
            <Badge variant="secondary">
              <User />
            </Badge>
          )}
        </div>
      )}
      {!client.isPrimary && (
        <div className="flex gap-1">
          <Badge variant="primary">
            <Crown />
          </Badge>
          <Badge variant="secondary">
            <User />
            {client.firstName || ''} {client.lastName || ''}
          </Badge>
        </div>
      )}
    </>
  );
};

export default ClientBadge;
